"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CreditCard, LogOut, Mail } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import { Button, Card, Select } from "@/shared/components/ui";
import { checkoutPath } from "@/features/payments/checkout-navigation";
import type { Checkout, Plan, PlanPrice } from "@/shared/types/domain";
import { toast } from "sonner";
export default function SuspendedAccountPage() {
  const { session, ready, logout } = useTenant();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan>();
  const plan =
    selectedPlan ??
    (session?.plan && session.plan !== "FREE" ? session.plan : "BASIC");
  const prices = useQuery({
    queryKey: ["plan-prices"],
    queryFn: () => api<PlanPrice[]>("/api/v1/payments/plans"),
    enabled: !!session && session.subscriptionStatus === "SUSPENDED",
  });
  const checkout = useMutation({
    mutationFn: () =>
      api<Checkout>("/api/v1/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: (value) => router.push(checkoutPath(value)),
    onError: (error: Error) => toast.error(error.message),
  });
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else if (session.role === "PLATFORM_ADMIN") router.replace("/plataforma");
    else if (session.subscriptionStatus !== "SUSPENDED")
      router.replace(
        session.role === "PENDING_COMPANY" ? "/pago/pendiente" : "/admin",
      );
  }, [ready, session, router]);
  if (!ready || !session || session.subscriptionStatus !== "SUSPENDED")
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Validando estado de la cuenta…
      </main>
    );
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 via-white to-rose-50 p-4">
      <Card className="w-full max-w-xl border-rose-200 p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-100 text-rose-700">
          <Ban size={30} />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-rose-700">
          Cuenta suspendida
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">
          El acceso de {session.tenant?.name} está suspendido
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Tus datos permanecen guardados, pero no puedes administrar la empresa
          ni recibir nuevas reservas hasta regularizar la suscripción. Al
          confirmarse el pago, la cuenta se reactivará automáticamente.
        </p>
        <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5 text-left">
          <strong className="text-slate-950">Reactiva tu negocio</strong>
          <p className="mt-1 text-sm text-slate-600">
            Elige un plan y completa el pago seguro.
          </p>
          <Select
            className="mt-4"
            value={plan}
            onChange={(e) => setSelectedPlan(e.target.value as Plan)}
          >
            {prices.data?.filter((item) => item.plan !== "FREE").map((item) => (
              <option key={item.plan} value={item.plan}>
                {item.plan} · S/ {item.amount}
              </option>
            ))}
          </Select>
          <Button
            className="mt-3 w-full"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            <CreditCard className="mr-2" size={17} />
            {checkout.isPending ? "Preparando pago…" : "Pagar y reactivar"}
          </Button>
        </div>
        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <Mail className="mx-auto mb-2 text-teal-700" />
          <strong className="block text-slate-900">¿Necesitas ayuda?</strong>
          Contacta al soporte indicando el correo{" "}
          <span className="font-semibold">{session.email}</span>.
        </div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </Card>
    </main>
  );
}
