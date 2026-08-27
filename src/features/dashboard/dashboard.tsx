"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Repeat2,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { api, download } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
} from "@/shared/components/ui";
import { dateTime, money } from "@/shared/lib/utils";
import type {
  CommercialCustomer,
  CommercialDashboard,
  Coupon,
} from "@/shared/types/domain";
const names: Record<string, string> = {
  PENDING: "Pendientes",
  CONFIRMED: "Confirmadas",
  COMPLETED: "Completadas",
  CANCELLED: "Anuladas",
  NO_SHOW: "No asistieron",
};
const tone = (s: string) =>
  s === "COMPLETED" || s === "CONFIRMED"
    ? "green"
    : s === "PENDING"
      ? "amber"
      : s === "CANCELLED"
        ? "red"
        : ("slate" as const);
export function Dashboard() {
  const { tenantId, session } = useTenant(),
    qc = useQueryClient();
  const [customer, setCustomer] = useState<CommercialCustomer>();
  const [coupon, setCoupon] = useState({
    code: "",
    discountPercent: "10",
    maxUses: "1",
    validUntil: "",
  });
  const report = useQuery({
    queryKey: ["commercial", tenantId],
    queryFn: () => api<CommercialDashboard>("/api/v1/commercial"),
    enabled: !!tenantId,
  });
  const createCoupon = useMutation({
    mutationFn: () =>
      api<Coupon>("/api/v1/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: coupon.code,
          description: `Beneficio para ${customer?.name}`,
          discountPercent: Number(coupon.discountPercent),
          maxUses: Number(coupon.maxUses),
          validUntil: coupon.validUntil
            ? new Date(`${coupon.validUntil}T23:59:59-05:00`).toISOString()
            : null,
          assignedCustomerId: customer?.id,
        }),
      }),
    onSuccess: () => {
      toast.success("Cupón creado");
      setCustomer(undefined);
      setCoupon({
        code: "",
        discountPercent: "10",
        maxUses: "1",
        validUntil: "",
      });
      qc.invalidateQueries({ queryKey: ["coupons", tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!tenantId || !session?.tenant)
    return (
      <Empty
        title="Inicia sesión"
        description="Necesitamos conocer tu empresa."
      />
    );
  const currency = session.tenant.currency,
    relative = `/${session.tenant.slug}`,
    data = report.data;
  const commercialTools = session.plan === "PLUS" || session.plan === "PREMIUM";
  const copy = () =>
    navigator.clipboard
      .writeText(`${window.location.origin}${relative}`)
      .then(() => toast.success("Enlace copiado"));
  const exportExcel = () =>
    commercialTools
      ? download("/api/v1/commercial/export", "reservas-contabilidad.csv")
          .then(() => toast.success("Reporte descargado para Excel"))
          .catch((e: Error) => toast.error(e.message))
      : Promise.resolve(
          toast.info("La exportación está disponible desde el plan Plus"),
        );
  return (
    <>
      <Card className="mb-6 border-teal-200 bg-teal-950 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">
          Tu página está lista
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          Comparte tu enlace de reservas
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-white/10 px-4 py-3 text-sm">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {relative}
          </code>
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-950"
          >
            <Copy size={17} />
            Copiar
          </button>
          <Link
            target="_blank"
            href={relative}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-bold"
          >
            <ExternalLink size={17} />
            Abrir
          </Link>
        </div>
      </Card>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Rendimiento comercial
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-teal-950">
            Reservas e ingresos
          </h1>
        </div>
        <Button
          onClick={exportExcel}
          className={!commercialTools ? "bg-slate-400 hover:bg-slate-400" : ""}
        >
          <Download size={17} /> Exportar para Excel
        </Button>
      </div>
      {report.isLoading ? (
        <Card>Cargando indicadores…</Card>
      ) : report.isError ? (
        <Card className="border-rose-200 text-rose-700">
          No pudimos cargar el reporte.
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Total de reservas"
              value={String(data?.totalBookings ?? 0)}
              icon={CalendarCheck}
            />
            <Metric
              label="Ingresos potenciales"
              value={money(data?.potentialRevenue ?? 0, currency)}
              icon={TrendingUp}
            />
            <Metric
              label="Ingresos completados"
              value={money(data?.completedRevenue ?? 0, currency)}
              icon={WalletCards}
            />
            <Metric
              label="Clientes recurrentes"
              value={
                commercialTools
                  ? String(
                      data?.customers.filter((x) => x.recurring).length ?? 0,
                    )
                  : "Plan Plus"
              }
              icon={Repeat2}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {data?.byStatus.map((x) => (
              <Card key={x.status}>
                <Badge tone={tone(x.status)}>
                  {names[x.status] ?? x.status}
                </Badge>
                <p className="mt-3 text-2xl font-extrabold">{x.count}</p>
                <p className="text-sm text-slate-500">
                  {money(x.amount, currency)}
                </p>
              </Card>
            ))}
          </div>
          <Card className="mt-6 overflow-hidden p-0">
            <div className="flex items-center justify-between p-5">
              <div>
                <h2 className="text-2xl font-semibold">Detalle contable</h2>
                <p className="text-sm text-slate-500">
                  Importes históricos aunque cambie el precio del servicio.
                </p>
              </div>
              <Link
                href="/admin/bookings"
                className="text-sm font-bold text-teal-700"
              >
                Gestionar
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Fecha",
                      "Cliente",
                      "Servicio / personal",
                      "Estado",
                      "Precio",
                      "Descuento",
                      "Total",
                    ].map((x) => (
                      <th className="px-5 py-3" key={x}>
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.recent.map((x) => (
                    <tr key={x.id}>
                      <td className="px-5 py-4 font-semibold">
                        {dateTime(x.startAt)}
                      </td>
                      <td className="px-5 py-4">
                        <strong className="block">{x.customerName}</strong>
                        <span className="text-xs text-slate-500">
                          {x.customerPhone}
                          {x.customerEmail ? ` · ${x.customerEmail}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {x.serviceName}
                        <span className="block text-xs text-slate-500">
                          {x.staffName}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={tone(x.status)}>
                          {names[x.status] ?? x.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {money(x.originalAmount, currency)}
                      </td>
                      <td className="px-5 py-4 text-emerald-700">
                        -{money(x.discountAmount, currency)}
                        {x.couponCode && (
                          <small className="block">{x.couponCode}</small>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold">
                        {money(x.finalAmount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {commercialTools ? (
            <Card className="mt-6 overflow-hidden p-0">
              <div className="p-5">
                <h2 className="text-2xl font-semibold">Clientes</h2>
                <p className="text-sm text-slate-500">
                  Contacto, recurrencia y fidelización.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {[
                        "Cliente",
                        "Contacto",
                        "Reservas",
                        "Completadas",
                        "Acumulado",
                        "Fidelización",
                      ].map((x) => (
                        <th className="px-5 py-3" key={x}>
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.customers.map((x) => (
                      <tr key={x.id}>
                        <td className="px-5 py-4 font-bold">{x.name}</td>
                        <td className="px-5 py-4">
                          {x.phone}
                          <small className="block text-slate-500">
                            {x.email}
                          </small>
                        </td>
                        <td className="px-5 py-4">{x.bookingCount}</td>
                        <td className="px-5 py-4">{x.completedCount}</td>
                        <td className="px-5 py-4 font-semibold">
                          {money(x.accumulatedAmount, currency)}
                        </td>
                        <td className="px-5 py-4">
                          {x.recurring ? (
                            <Button
                              className="min-h-9 px-3 py-1.5 text-xs"
                              onClick={() => setCustomer(x)}
                            >
                              <Gift size={15} /> Crear cupón
                            </Button>
                          ) : (
                            <small className="text-slate-400">
                              Desde 2 reservas
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="mt-6 border-amber-200 bg-amber-50">
              <Gift className="text-amber-700" />
              <h2 className="mt-3 text-2xl font-semibold">
                Clientes y fidelización desde Plus
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Actualiza tu plan para consultar contactos, recurrencia,
                acumulados, crear cupones y exportar contabilidad.
              </p>
              <Link
                href="/admin/plan"
                className="mt-4 inline-flex rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white"
              >
                Actualizar plan
              </Link>
            </Card>
          )}
        </>
      )}
      {customer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <Card className="w-full max-w-lg">
            <h2 className="text-2xl font-semibold">
              Cupón para {customer.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Válido únicamente para {customer.phone}.
            </p>
            <div className="mt-5 grid gap-4">
              <Field label="Código">
                <Input
                  value={coupon.code}
                  onChange={(e) =>
                    setCoupon({
                      ...coupon,
                      code: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9-]/g, ""),
                    })
                  }
                  placeholder="GRACIAS10"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Descuento %">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={coupon.discountPercent}
                    onChange={(e) =>
                      setCoupon({ ...coupon, discountPercent: e.target.value })
                    }
                  />
                </Field>
                <Field label="Usos máximos">
                  <Input
                    type="number"
                    min="1"
                    value={coupon.maxUses}
                    onChange={(e) =>
                      setCoupon({ ...coupon, maxUses: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Field label="Válido hasta">
                <Input
                  type="date"
                  value={coupon.validUntil}
                  onChange={(e) =>
                    setCoupon({ ...coupon, validUntil: e.target.value })
                  }
                />
              </Field>
              <div className="flex justify-end gap-3">
                <Button
                  className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  onClick={() => setCustomer(undefined)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!coupon.code || createCoupon.isPending}
                  onClick={() => createCoupon.mutate()}
                >
                  {createCoupon.isPending ? "Creando…" : "Crear cupón"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CalendarCheck;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
          <Icon size={20} />
        </span>
        <span className="text-right text-2xl font-extrabold text-teal-950">
          {value}
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
    </Card>
  );
}
