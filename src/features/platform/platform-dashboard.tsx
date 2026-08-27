"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  LogOut,
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
export function PlatformDashboard() {
  const { session, ready, logout } = useTenant();
  const router = useRouter();
  const qc = useQueryClient();
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
    </main>
  );
}
