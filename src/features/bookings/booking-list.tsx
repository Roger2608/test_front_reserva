"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Select,
} from "@/shared/components/ui";
import { dateTime } from "@/shared/lib/utils";
import type {
  Booking,
  Location,
  Resource,
  Service,
} from "@/shared/types/domain";
const tone = (s: string) =>
  s === "CONFIRMED"
    ? "green"
    : s === "PENDING"
      ? "amber"
      : s === "CANCELLED"
        ? "red"
        : ("slate" as const);
export function BookingList() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["bookings", tenantId],
    queryFn: () => api<Booking[]>("/api/v1/bookings", { tenantId }),
    enabled: !!tenantId,
  });
  const transition = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api<Booking>(`/api/v1/bookings/${id}/${action}`, {
        tenantId,
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", tenantId] });
      toast.success("Estado actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!tenantId)
    return (
      <Empty
        title="Selecciona una empresa"
        description="Las reservas están aisladas por tenant."
      />
    );
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {["Fecha", "Origen", "Estado", "Referencia", "Acciones"].map(
                (h) => (
                  <th key={h} className="px-5 py-4">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.data?.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold">
                  {dateTime(b.startAt)}
                </td>
                <td className="px-5 py-4 text-slate-500">{b.source}</td>
                <td className="px-5 py-4">
                  <Badge tone={tone(b.status)}>{b.status}</Badge>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">
                  {b.id.slice(0, 8)}
                </td>
                <td className="flex gap-2 px-5 py-4">
                  {b.status === "PENDING" && (
                    <>
                      <Button
                        className="min-h-9 px-3 py-1.5 text-xs"
                        onClick={() =>
                          transition.mutate({ id: b.id, action: "confirm" })
                        }
                      >
                        Confirmar
                      </Button>
                      <Button
                        className="min-h-9 bg-white px-3 py-1.5 text-xs text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
                        onClick={() =>
                          transition.mutate({ id: b.id, action: "cancel" })
                        }
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  {b.status === "CONFIRMED" && (
                    <>
                      <Button
                        className="min-h-9 px-3 py-1.5 text-xs"
                        onClick={() =>
                          transition.mutate({ id: b.id, action: "complete" })
                        }
                      >
                        Completar
                      </Button>
                      <Button
                        className="min-h-9 bg-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800"
                        onClick={() =>
                          transition.mutate({ id: b.id, action: "no-show" })
                        }
                      >
                        No asistió
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!list.data?.length && (
        <div className="p-5">
          <Empty
            title="Sin reservas"
            description="Las nuevas reservas aparecerán aquí."
          />
        </div>
      )}
    </Card>
  );
}

export function BookingCreator() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    locationId: "",
    serviceId: "",
    resourceId: "",
    startAt: "",
    name: "",
    phone: "",
  });
  const locations = useQuery({
    queryKey: ["locations", tenantId],
    queryFn: () => api<Location[]>("/api/v1/locations", { tenantId }),
    enabled: !!tenantId,
  });
  const services = useQuery({
    queryKey: ["services", tenantId],
    queryFn: () => api<Service[]>("/api/v1/services", { tenantId }),
    enabled: !!tenantId,
  });
  const resources = useQuery({
    queryKey: ["resources", tenantId],
    queryFn: () => api<Resource[]>("/api/v1/resources", { tenantId }),
    enabled: !!tenantId,
  });
  const create = useMutation({
    mutationFn: () =>
      api<Booking>("/api/v1/bookings", {
        tenantId,
        method: "POST",
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({
          locationId: form.locationId,
          serviceId: form.serviceId,
          resourceId: form.resourceId,
          startAt: new Date(form.startAt).toISOString(),
          customer: {
            name: form.name,
            phone: form.phone,
            whatsappOptIn: false,
          },
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", tenantId] });
      toast.success("Reserva administrativa creada");
      setForm({
        locationId: "",
        serviceId: "",
        resourceId: "",
        startAt: "",
        name: "",
        phone: "",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!tenantId) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-semibold">Reserva rápida</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-3">
        <Field label="Sede">
          <Select
            required
            value={form.locationId}
            onChange={(e) =>
              setForm({ ...form, locationId: e.target.value, resourceId: "" })
            }
          >
            <option value="">Seleccionar</option>
            {locations.data?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Servicio">
          <Select
            required
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          >
            <option value="">Seleccionar</option>
            {services.data?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Recurso">
          <Select
            required
            value={form.resourceId}
            onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
          >
            <option value="">Seleccionar</option>
            {resources.data
              ?.filter(
                (x) => !form.locationId || x.locationId === form.locationId,
              )
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Fecha y hora">
          <Input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
        </Field>
        <Field label="Cliente">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Teléfono">
          <Input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <div className="md:col-span-3 md:justify-self-end">
          <Button disabled={create.isPending}>
            {create.isPending ? "Creando…" : "Crear reserva"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
