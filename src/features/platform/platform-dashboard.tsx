"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  LogOut,
  MessageSquareText,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import { Badge, Button, Card, Empty } from "@/shared/components/ui";
import { money } from "@/shared/lib/utils";
type Overview = {
  tenants: number;
  activeTenants: number;
  users: number;
  bookings: number;
  activeSubscriptions: number;
  collectedRevenue: number;
  estimatedMonthlyRevenue: number;
  customerGmv: number;
  plans: Record<string, number>;
};
type Tenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  subscriptionStatus: string;
  plan: string;
  ownerName?: string;
  ownerEmail?: string;
  users: number;
  bookings: number;
  customerGmv: number;
  paidToPlatform: number;
  createdAt: string;
};
type SupportTicket = {
  id: string;
  tenantName: string;
  ownerEmail?: string;
  category: string;
  subject: string;
  description: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  adminResponse?: string;
  createdAt: string;
};
export function PlatformDashboard() {
  const { session, ready, logout } = useTenant();
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket>();
  const [supportResponse, setSupportResponse] = useState("");
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    if (ready && session?.role !== "PLATFORM_ADMIN")
      router.replace(session ? "/admin" : "/login");
  }, [ready, session, router]);
  const enabled = session?.role === "PLATFORM_ADMIN";
  const overview = useQuery({
    queryKey: ["platform-overview"],
    queryFn: () => api<Overview>("/api/v1/platform/overview"),
    enabled,
  });
  const tenants = useQuery({
    queryKey: ["platform-tenants"],
    queryFn: () => api<Tenant[]>("/api/v1/platform/tenants"),
    enabled,
  });
  const support = useQuery({
    queryKey: ["platform-support"],
    queryFn: () => api<SupportTicket[]>("/api/v1/platform/support"),
    enabled,
  });
  const change = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "suspend" | "resume";
    }) =>
      api<Tenant>(`/api/v1/platform/tenants/${id}/${action}`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-tenants"] });
      qc.invalidateQueries({ queryKey: ["platform-overview"] });
      toast.success("Estado de la empresa actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const respond = useMutation({
    mutationFn: () =>
      api<SupportTicket>(
        `/api/v1/platform/support/${selectedTicket?.id}/response`,
        {
          method: "PUT",
          body: JSON.stringify({ response: supportResponse, resolved }),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-support"] });
      setSelectedTicket(undefined);
      setSupportResponse("");
      setResolved(false);
      toast.success("Respuesta enviada a la empresa");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (!enabled)
    return (
      <main className="grid min-h-screen place-items-center">
        Validando acceso…
      </main>
    );
  const stats = [
    [
      "Ingresos cobrados",
      money(overview.data?.collectedRevenue ?? 0, "PEN"),
      CircleDollarSign,
    ],
    [
      "Ingreso mensual estimado",
      money(overview.data?.estimatedMonthlyRevenue ?? 0, "PEN"),
      TrendingUp,
    ],
    [
      "GMV de empresas",
      money(overview.data?.customerGmv ?? 0, "PEN"),
      CalendarDays,
    ],
    [
      "Empresas activas",
      `${overview.data?.activeTenants ?? 0} / ${overview.data?.tenants ?? 0}`,
      Building2,
    ],
    ["Usuarios", overview.data?.users ?? 0, Users],
    ["Reservas", overview.data?.bookings ?? 0, CalendarDays],
  ] as const;
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-slate-950 text-white">
        <div className="shell flex h-20 items-center justify-between">
          <div>
            <p className="font-extrabold">
              turno<span className="text-emerald-400">.</span>
            </p>
            <p className="text-xs text-slate-400">Administración del SaaS</p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex items-center gap-2 text-sm"
          >
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </header>
      <div className="shell py-10">
        <h1 className="text-4xl font-semibold">Salud de la plataforma</h1>
        <p className="mt-2 text-slate-500">
          Empresas, suscripciones, reservas e ingresos desde un solo panel.
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map(([label, value, Icon]) => (
            <Card key={label}>
              <Icon className="text-teal-700" />
              <p className="mt-5 text-3xl font-extrabold">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </Card>
          ))}
        </div>
        <Card className="mt-7">
          <h2 className="text-2xl font-semibold">Distribución de planes</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {["FREE", "BASIC", "PLUS", "PREMIUM"].map((plan) => (
              <div key={plan} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">{plan}</p>
                <p className="mt-1 text-2xl font-extrabold">
                  {overview.data?.plans?.[plan] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="mt-7 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-semibold">
                <MessageSquareText className="text-teal-700" /> Cola de soporte
              </h2>
              <p className="text-sm text-slate-500">
                Premium tiene prioridad urgente, Plus alta y Basic normal.
              </p>
            </div>
            <Badge tone="slate">
              {support.data?.filter((ticket) => ticket.status !== "RESOLVED")
                .length ?? 0}{" "}
              pendientes
            </Badge>
          </div>
          {support.data?.length ? (
            <div className="divide-y">
              {support.data.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid gap-4 p-5 lg:grid-cols-[170px_1fr_auto] lg:items-start"
                >
                  <div>
                    <Badge
                      tone={
                        ticket.priority === "URGENT"
                          ? "red"
                          : ticket.priority === "HIGH"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {ticket.priority === "URGENT"
                        ? "Urgente"
                        : ticket.priority === "HIGH"
                          ? "Alta"
                          : "Normal"}
                    </Badge>
                    <p className="mt-2 font-bold">{ticket.tenantName}</p>
                    <p className="break-all text-xs text-slate-500">
                      {ticket.ownerEmail}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{ticket.subject}</h3>
                      <Badge
                        tone={ticket.status === "RESOLVED" ? "green" : "slate"}
                      >
                        {ticket.status === "RESOLVED"
                          ? "Resuelto"
                          : ticket.status === "IN_PROGRESS"
                            ? "En atención"
                            : "Abierto"}
                      </Badge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                      {ticket.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleString("es-PE")}
                    </p>
                    {ticket.adminResponse && (
                      <p className="mt-3 rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
                        <strong>Respuesta:</strong> {ticket.adminResponse}
                      </p>
                    )}
                  </div>
                  <Button
                    className="whitespace-nowrap"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setSupportResponse(ticket.adminResponse ?? "");
                      setResolved(ticket.status === "RESOLVED");
                    }}
                  >
                    {ticket.adminResponse ? "Actualizar" : "Responder"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <Empty
                title="Sin solicitudes"
                description="Las consultas de las empresas aparecerán aquí según su prioridad."
              />
            </div>
          )}
        </Card>
        <Card className="mt-7 overflow-hidden p-0">
          <div className="p-5">
            <h2 className="text-2xl font-semibold">Gestión de empresas</h2>
            <p className="text-sm text-slate-500">
              Facturación, actividad, propietario y control de acceso.
            </p>
          </div>
          {tenants.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Empresa",
                      "Propietario",
                      "Plan",
                      "Usuarios",
                      "Reservas",
                      "GMV",
                      "Pagado SaaS",
                      "Estado",
                      "Acción",
                    ].map((x) => (
                      <th key={x} className="px-4 py-3">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tenants.data.map((x) => (
                    <tr key={x.id}>
                      <td className="px-4 py-4">
                        <strong>{x.name}</strong>
                        <small className="block text-slate-500">
                          /{x.slug}
                        </small>
                      </td>
                      <td className="px-4 py-4">
                        {x.ownerName ?? "—"}
                        <small className="block text-slate-500">
                          {x.ownerEmail}
                        </small>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={x.plan === "PREMIUM" ? "green" : "slate"}>
                          {x.plan}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">{x.users}</td>
                      <td className="px-4 py-4">{x.bookings}</td>
                      <td className="px-4 py-4">
                        {money(x.customerGmv, "PEN")}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {money(x.paidToPlatform, "PEN")}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={x.active ? "green" : "amber"}>
                          {x.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          disabled={change.isPending}
                          className={x.active ? "bg-rose-700" : ""}
                          onClick={() =>
                            change.mutate({
                              id: x.id,
                              action: x.active ? "suspend" : "resume",
                            })
                          }
                        >
                          {x.active ? "Suspender" : "Reactivar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Sin empresas"
              description="Las empresas registradas aparecerán aquí."
            />
          )}
        </Card>
      </div>
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <Card className="w-full max-w-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
              {selectedTicket.tenantName}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              Responder: {selectedTicket.subject}
            </h2>
            <textarea
              className="mt-5 min-h-40 w-full rounded-xl border border-slate-300 p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
              maxLength={4000}
              value={supportResponse}
              onChange={(event) => setSupportResponse(event.target.value)}
              placeholder="Escribe una respuesta clara para la empresa…"
            />
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={resolved}
                onChange={(event) => setResolved(event.target.checked)}
              />
              Marcar la solicitud como resuelta
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                className="bg-slate-200 text-slate-800 hover:bg-slate-300"
                onClick={() => setSelectedTicket(undefined)}
              >
                Cancelar
              </Button>
              <Button
                disabled={respond.isPending || !supportResponse.trim()}
                onClick={() => respond.mutate()}
              >
                {respond.isPending ? "Enviando…" : "Enviar respuesta"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
