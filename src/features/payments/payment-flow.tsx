"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import { Button, Card } from "@/shared/components/ui";
import type { Checkout, Session } from "@/shared/types/domain";
import { checkoutPath } from "@/features/payments/checkout-navigation";

export function PaymentPending() {
  const { session, ready } = useTenant();
  const router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace("/login");
    else if (session && session.role !== "PENDING_COMPANY")
      router.replace(
        session.role === "PLATFORM_ADMIN" ? "/plataforma" : "/admin",
      );
  }, [ready, session, router]);
  if (!session?.checkout)
    return (
      <main className="grid min-h-screen place-items-center">
        <Card>Verificando pago…</Card>
      </main>
    );
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f6] p-4">
      <Card className="w-full max-w-lg p-8">
        <CreditCard className="text-teal-700" size={36} />
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-teal-700">
          Activación de empresa
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Completa tu pago</h1>
        <p className="mt-3 text-slate-600">
          Plan {session.checkout.plan} para {session.tenant?.name}
        </p>
        <div className="mt-6 flex items-end justify-between rounded-xl bg-slate-50 p-5">
          <span className="text-sm text-slate-500">Total de activación</span>
          <strong className="text-3xl">
            {session.checkout.currency} {session.checkout.amount}
          </strong>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push(
              session.checkout!.paymentInProgress
                ? "/pago/resultado"
                : checkoutPath(session.checkout!),
            )
          }
          className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-5 font-bold text-white"
        >
          {session.checkout.paymentInProgress
            ? "Revisar pago pendiente"
            : "Pagar con tarjeta o Yape"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <LockKeyhole size={14} />
          La aplicación nunca almacena los datos de tu tarjeta ni tu código
          Yape.
        </p>
      </Card>
    </main>
  );
}

export function FakeCheckout() {
  const { session, setAuth } = useTenant();
  const router = useRouter();
  const queryClient = useQueryClient();
  const checkout = session?.checkout;
  const initialRegistration = session?.role === "PENDING_COMPANY";
  const approve = useMutation({
    mutationFn: () =>
      api<Checkout>(`/api/v1/payments/${checkout?.id}/approve-dev`, {
        method: "POST",
      }),
    onSuccess: async () => {
      const refreshed = await api<Session>("/api/v1/auth/refresh", {
        method: "POST",
        noRefresh: true,
      });
      setAuth(refreshed);
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Pago de desarrollo aprobado");
      router.replace(initialRegistration ? "/admin" : "/admin/plan");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!checkout)
    return (
      <main className="grid min-h-screen place-items-center">
        <Card>Checkout no disponible.</Card>
      </main>
    );
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <Card className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
          Simulador local
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Mercado Pago (dev)</h1>
        <p className="mt-3 text-sm text-slate-600">
          Esta pantalla no realiza cargos. En producción se reemplaza
          automáticamente por Checkout Pro.
        </p>
        <div className="my-6 rounded-xl bg-teal-50 p-5">
          <p>Plan {checkout.plan}</p>
          <strong className="text-3xl">
            {checkout.currency} {checkout.amount}
          </strong>
        </div>
        <Button
          className="w-full"
          disabled={approve.isPending}
          onClick={() => approve.mutate()}
        >
          {approve.isPending ? "Confirmando…" : "Simular pago aprobado"}
        </Button>
      </Card>
    </main>
  );
}

export function PaymentResult() {
  const { session, ready, setAuth } = useTenant();
  const router = useRouter();
  const handled = useRef(false);
  const status = useQuery({
    queryKey: ["payment-status"],
    queryFn: () => api<Checkout>("/api/v1/payments/status"),
    enabled: ready && !!session,
    retry: 6,
  });
  const checkout = status.data ?? session?.checkout;
  const refreshSession = async () => {
    const next = await api<Session>("/api/v1/auth/refresh", {
      method: "POST",
      noRefresh: true,
    });
    setAuth(next);
    return next;
  };
  const retryPayment = useMutation({
    mutationFn: () => {
      if (!checkout) throw new Error("No existe un pago para reintentar");
      return api<Checkout>(`/api/v1/payments/${checkout.id}/retry`, {
        method: "POST",
      });
    },
    onSuccess: async (nextCheckout) => {
      if (nextCheckout.status === "PAID") {
        await refreshSession();
        toast.success("El pago ya estaba aprobado y tu plan está activo");
        router.replace("/admin/plan");
        return;
      }
      if (session) setAuth({ ...session, checkout: nextCheckout });
      toast.info("El intento anterior fue cancelado. Puedes pagar nuevamente");
      window.location.assign(
        nextCheckout.checkoutUrl ??
          `/pago/checkout?checkout=${nextCheckout.id}`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const cancelPayment = useMutation({
    mutationFn: () => {
      if (!checkout) throw new Error("No existe un pago para cancelar");
      return api<{ paymentAlreadyApproved: boolean }>(
        `/api/v1/payments/${checkout.id}/abort`,
        { method: "POST" },
      );
    },
    onSuccess: async (result) => {
      const wasRegistration = session?.role === "PENDING_COMPANY";
      await refreshSession();
      if (result.paymentAlreadyApproved) {
        toast.success("El pago ya estaba aprobado y tu plan está activo");
        router.replace("/admin/plan");
        return;
      }
      toast.info(
        wasRegistration
          ? "Cancelamos el pago pendiente y activamos tu cuenta con el plan Free"
          : "Cancelamos el pago pendiente; conservas tu plan actual",
      );
      router.replace("/admin");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  useEffect(() => {
    if (status.data?.status !== "PAID" || handled.current) return;
    handled.current = true;
    api<Session>("/api/v1/auth/refresh", { method: "POST", noRefresh: true })
      .then((next) => {
        setAuth(next);
        toast.success("Pago confirmado. Tu nuevo plan ya está activo");
        router.replace(
          next.role === "PENDING_COMPANY" ? "/pago/pendiente" : "/admin/plan",
        );
      })
      .catch(() => {
        handled.current = false;
      });
  }, [router, setAuth, status.data?.status]);
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f6] p-4">
      <Card className="max-w-lg text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Mercado Pago
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {status.data?.status === "PAID"
            ? "Pago confirmado"
            : status.data?.status === "FAILED" ||
                status.data?.status === "CANCELLED"
              ? "El pago no se completó"
              : "Tu pago sigue pendiente"}
        </h1>
        <p className="mt-3 text-slate-600">
          {status.data?.status === "PAID"
            ? "Mercado Pago confirmó la operación correctamente."
            : "Mercado Pago nos notificará el resultado mediante webhook. Puedes actualizar la vista, cancelar el intento o generar uno nuevo sin duplicar el cobro."}
        </p>
        {status.isError && (
          <p className="mt-5 rounded-xl bg-teal-50 p-3 text-sm text-teal-800">
            La confirmación aún no está disponible. Puedes volver a Mi plan y
            continuar revisando allí.
          </p>
        )}
        {checkout?.status !== "PAID" && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              disabled={status.isFetching}
              onClick={() => void status.refetch()}
            >
              {status.isFetching ? "Actualizando…" : "Actualizar estado"}
            </Button>
            <Button
              disabled={retryPayment.isPending || cancelPayment.isPending}
              onClick={() => retryPayment.mutate()}
            >
              {retryPayment.isPending ? "Preparando…" : "Cancelar y reintentar"}
            </Button>
            <Button
              className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              disabled={retryPayment.isPending || cancelPayment.isPending}
              onClick={() => cancelPayment.mutate()}
            >
              {cancelPayment.isPending ? "Cancelando…" : "Cancelar y Continuar"}
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}
