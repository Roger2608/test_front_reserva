"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { ArrowLeft, ArrowRight, Check, Clock3 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CustomerBookingAdvertisement } from "@/features/advertising/advertisement-banner";
import { api, qs } from "@/shared/api/client";
import { Button, Card, Field, Input, Select } from "@/shared/components/ui";
import { newIdempotencyKey } from "@/shared/lib/idempotency";
import type {
  Booking,
  CreateBooking,
  Location,
  PublicSite,
  Resource,
  Service,
  Slot,
  CouponValidation,
} from "@/shared/types/domain";

export function BookingWizard({ slug }: { slug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const idempotency = useRef(newIdempotencyKey());
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    serviceId: search.get("serviceId") ?? "",
    locationId: "",
    resourceId: "",
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    startAt: "",
    name: "",
    phone: "",
    email: "",
    whatsappOptIn: false,
    couponCode: "",
  });
  const site = useQuery({
    queryKey: ["public-site", slug],
    queryFn: () => api<PublicSite>(`/public/v1/${slug}/site`),
  });
  const services = useQuery({
    queryKey: ["public-services", slug],
    queryFn: () => api<Service[]>(`/public/v1/${slug}/services`),
  });
  const locations = useQuery({
    queryKey: ["public-locations", slug],
    queryFn: () => api<Location[]>(`/public/v1/${slug}/locations`),
  });
  const resources = useQuery({
    queryKey: ["public-resources", slug],
    queryFn: () => api<Resource[]>(`/public/v1/${slug}/resources`),
  });
  const filtered = useMemo(
    () =>
      resources.data?.filter(
        (resource) =>
          !data.locationId || resource.locationId === data.locationId,
      ) ?? [],
    [resources.data, data.locationId],
  );
  const slots = useQuery({
    queryKey: [
      "slots",
      slug,
      data.serviceId,
      data.locationId,
      data.resourceId,
      data.date,
    ],
    queryFn: () =>
      api<Slot[]>(
        `/public/v1/${slug}/availability?${qs({ serviceId: data.serviceId, locationId: data.locationId, resourceId: data.resourceId || undefined, date: data.date })}`,
      ),
    enabled: !!data.serviceId && !!data.locationId && !!data.date,
  });
  const create = useMutation({
    mutationFn: () => {
      const body: CreateBooking = {
        locationId: data.locationId,
        serviceId: data.serviceId,
        resourceId: data.resourceId,
        startAt: data.startAt,
        couponCode: data.couponCode || undefined,
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          whatsappOptIn: site.data?.capabilities.canAutomateWhatsapp
            ? data.whatsappOptIn
            : false,
        },
      };
      return api<Booking>(`/public/v1/${slug}/bookings`, {
        method: "POST",
        body: JSON.stringify(body),
        idempotencyKey: idempotency.current,
      });
    },
    onSuccess: (booking) =>
      router.push(`/${slug}/reserva/${booking.publicToken}`),
    onError: (error: Error) => toast.error(error.message),
  });
  const validateCoupon = useMutation({
    mutationFn: () =>
      api<CouponValidation>(`/public/v1/${slug}/coupons/validate`, {
        method: "POST",
        body: JSON.stringify({
          code: data.couponCode,
          serviceId: data.serviceId,
          phone: data.phone,
        }),
      }),
    onSuccess: (result) =>
      toast.success(`Cupón aplicado: ${result.discountPercent}% de descuento`),
    onError: (error: Error) => toast.error(error.message),
  });
  const valid =
    step === 1
      ? data.serviceId && data.locationId
      : step === 2
        ? data.resourceId && data.startAt
        : data.name && data.phone;
  const whatsapp = site.data?.capabilities.canAutomateWhatsapp;
  return (
    <main className="min-h-screen bg-[#f4f7f6] py-8">
      <div className="mx-auto w-[min(760px,calc(100%-2rem))]">
        <button
          onClick={() =>
            step === 1 ? router.push(`/${slug}`) : setStep(step - 1)
          }
          className="flex items-center gap-2 text-sm font-bold text-teal-800"
        >
          <ArrowLeft size={17} />
          Volver
        </button>
        <div className="mt-7">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Paso {step} de 3
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-teal-950">
            {step === 1
              ? "¿Qué deseas reservar?"
              : step === 2
                ? "Elige tu horario"
                : "Tus datos"}
          </h1>
        </div>
        <div className="mt-7 flex gap-2">
          {[1, 2, 3].map((number) => (
            <span
              key={number}
              className={`h-1.5 flex-1 rounded-full ${number <= step ? "bg-teal-700" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <CustomerBookingAdvertisement
          slug={slug}
          enabled={site.data?.capabilities.showCustomerAds ?? false}
          reserve={site.isLoading}
        />
        <Card className="mt-6">
          {step === 1 && (
            <div className="grid gap-4">
              <Field label="Servicio">
                <Select
                  value={data.serviceId}
                  onChange={(event) =>
                    setData({
                      ...data,
                      serviceId: event.target.value,
                      startAt: "",
                    })
                  }
                >
                  <option value="">Seleccionar servicio</option>
                  {services.data?.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} · {service.durationMinutes} min
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sede">
                <Select
                  value={data.locationId}
                  onChange={(event) =>
                    setData({
                      ...data,
                      locationId: event.target.value,
                      resourceId: "",
                      startAt: "",
                    })
                  }
                >
                  <option value="">Seleccionar sede</option>
                  {locations.data?.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-5">
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Elige un profesional{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      setData({ ...data, resourceId: "", startAt: "" })
                    }
                    className={`rounded-2xl border p-3 text-left ${!data.resourceId ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-teal-100 text-xl font-bold text-teal-800">
                      ✓
                    </span>
                    <strong className="mt-2 block">Cualquiera</strong>
                    <small className="text-slate-500">Primero disponible</small>
                  </button>
                  {filtered
                    .filter((x) => x.type === "STAFF")
                    .map((resource) => (
                      <button
                        type="button"
                        key={resource.id}
                        onClick={() =>
                          setData({
                            ...data,
                            resourceId: resource.id,
                            startAt: "",
                          })
                        }
                        className={`rounded-2xl border p-3 text-left ${data.resourceId === resource.id ? "border-teal-600 bg-teal-50" : "border-slate-200"}`}
                      >
                        {resource.imageUrl ? (
                          <span
                            className="block h-14 w-14 rounded-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${resource.imageUrl})`,
                            }}
                          />
                        ) : (
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-xl font-bold">
                            {resource.name.charAt(0)}
                          </span>
                        )}
                        <strong className="mt-2 block">{resource.name}</strong>
                        <small className="line-clamp-2 text-slate-500">
                          {resource.bio || "Profesional disponible"}
                        </small>
                      </button>
                    ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fecha">
                  <Input
                    type="date"
                    min={format(new Date(), "yyyy-MM-dd")}
                    value={data.date}
                    onChange={(event) =>
                      setData({
                        ...data,
                        date: event.target.value,
                        startAt: "",
                      })
                    }
                  />
                </Field>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Horarios disponibles
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.data?.map((slot) => (
                    <button
                      key={`${slot.resourceId}-${slot.startAt}`}
                      onClick={() =>
                        setData({
                          ...data,
                          resourceId: slot.resourceId,
                          startAt: slot.startAt,
                        })
                      }
                      className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-3 text-sm font-bold ${data.startAt === slot.startAt ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 hover:border-teal-500"}`}
                    >
                      <Clock3 size={15} />
                      {format(new Date(slot.startAt), "HH:mm")}
                    </button>
                  ))}
                </div>
                {slots.data?.length === 0 && (
                  <p className="rounded-xl bg-teal-50 p-4 text-sm text-teal-800">
                    No hay horarios para esta selección.
                  </p>
                )}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-4">
              <Field label="Nombre completo">
                <Input
                  value={data.name}
                  onChange={(event) =>
                    setData({ ...data, name: event.target.value })
                  }
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Teléfono">
                  <Input
                    type="tel"
                    value={data.phone}
                    onChange={(event) =>
                      setData({ ...data, phone: event.target.value })
                    }
                  />
                </Field>
                <Field label="Correo (opcional)">
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(event) =>
                      setData({ ...data, email: event.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="rounded-xl border border-dashed border-teal-300 bg-teal-50/60 p-4">
                <Field label="Cupón de descuento (opcional)">
                  <div className="flex gap-2">
                    <Input
                      value={data.couponCode}
                      onChange={(event) => {
                        setData({
                          ...data,
                          couponCode: event.target.value.toUpperCase(),
                        });
                        validateCoupon.reset();
                      }}
                      placeholder="GRACIAS10"
                    />
                    <Button
                      type="button"
                      disabled={
                        !data.couponCode ||
                        !data.phone ||
                        validateCoupon.isPending
                      }
                      onClick={() => validateCoupon.mutate()}
                    >
                      {validateCoupon.isPending ? "Validando…" : "Aplicar"}
                    </Button>
                  </div>
                </Field>
                {validateCoupon.data && (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Ahorras {validateCoupon.data.discountAmount}. Total:{" "}
                    {validateCoupon.data.total}
                  </p>
                )}
              </div>
              {whatsapp && (
                <label className="flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-sm text-teal-950">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={data.whatsappOptIn}
                    onChange={(event) =>
                      setData({ ...data, whatsappOptIn: event.target.checked })
                    }
                  />
                  <span>
                    <strong className="block">Recibir por WhatsApp</strong>
                    {site.data?.capabilities.hasWhatsappReminder
                      ? "Autorizo la confirmación y un recordatorio antes de mi cita."
                      : "Autorizo la confirmación de mi reserva."}
                  </span>
                </label>
              )}
            </div>
          )}
          <div className="mt-7 flex justify-end">
            <Button
              disabled={!valid || create.isPending}
              onClick={() => (step < 3 ? setStep(step + 1) : create.mutate())}
            >
              {create.isPending ? (
                "Reservando…"
              ) : step < 3 ? (
                <>
                  Continuar <ArrowRight size={17} />
                </>
              ) : (
                <>
                  Confirmar reserva <Check size={17} />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
