"use client";

import { loadMercadoPago } from "@mercadopago/sdk-js";
import { CreditCard, LockKeyhole, Smartphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import { Button, Card, Field, Input } from "@/shared/components/ui";
import type {
  Checkout,
  DirectPaymentResult,
  Session,
} from "@/shared/types/domain";
import { checkoutPath } from "@/features/payments/checkout-navigation";

type CardFormData = {
  paymentMethodId: string;
  issuerId?: string;
  cardholderEmail: string;
  token: string;
  installments: string;
  identificationNumber: string;
  identificationType: string;
};
type CardForm = { getCardFormData: () => CardFormData };
type MercadoPagoInstance = {
  cardForm: (settings: Record<string, unknown>) => CardForm;
  yape: (options: { otp: string; phoneNumber: string }) => {
    create: () => Promise<{ id?: string } | string>;
  };
};
type MercadoPagoConstructor = new (
  publicKey: string,
  options?: { locale?: string },
) => MercadoPagoInstance;

const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus-within:border-teal-600 focus-within:ring-3 focus-within:ring-teal-100";

export function MercadoPagoCheckout() {
  const { session, ready, setAuth } = useTenant();
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const checkoutId = params.get("checkout") ?? session?.checkout?.id;
  const checkoutQuery = useQuery({
    queryKey: ["checkout", checkoutId],
    queryFn: () => api<Checkout>(`/api/v1/payments/${checkoutId}`),
    enabled: ready && !!session && !!checkoutId,
  });
  const checkout =
    checkoutQuery.data ??
    (session?.checkout?.id === checkoutId ? session?.checkout : undefined);
  const checkoutStatus = checkout?.status;
  const [method, setMethod] = useState<"card" | "yape">("card");
  const [loading, setLoading] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);
  const [paymentError, setPaymentError] = useState<string>();
  const [sdkError, setSdkError] = useState<string | undefined>(() =>
    publicKey ? undefined : "Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY",
  );
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [yapeEmail, setYapeEmail] = useState(session?.email ?? "");
  const mpRef = useRef<MercadoPagoInstance | undefined>(undefined);
  const cardRef = useRef<CardForm | undefined>(undefined);

  const refreshSession = async () => {
    const next = await api<Session>("/api/v1/auth/refresh", {
      method: "POST",
      noRefresh: true,
    });
    setAuth(next);
    return next;
  };
  const restart = useMutation({
    mutationFn: async () => {
      if (!checkout) throw new Error("No existe un checkout para reiniciar");
      if (checkout.status === "PENDING")
        await api<void>(`/api/v1/payments/${checkout.id}`, {
          method: "DELETE",
        });
      return api<NonNullable<Session["checkout"]>>(
        "/api/v1/payments/checkout",
        { method: "POST", body: JSON.stringify({ plan: checkout.plan }) },
      );
    },
    onSuccess: (next) => {
      if (session) setAuth({ ...session, checkout: next });
      router.push(checkoutPath(next));
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const abandon = useMutation({
    mutationFn: () =>
      checkout
        ? api<void>(`/api/v1/payments/${checkout.id}`, { method: "DELETE" })
        : Promise.resolve(),
    onSuccess: async () => {
      await refreshSession();
      await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Intento de pago cancelado");
      router.replace(
        session?.role === "PENDING_COMPANY" ? "/pago/pendiente" : "/admin/plan",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const finish = async (result: DirectPaymentResult) => {
    queryClient.setQueryData(["checkout", result.checkout.id], result.checkout);
    if (session) setAuth({ ...session, checkout: result.checkout });
    if (result.status === "approved") {
      const next = await refreshSession();
      setAuth(next);
      toast.success("Pago aprobado. Tu plan ya está activo");
      router.replace("/admin/plan");
      return;
    }
    if (result.status === "pending" || result.status === "in_process") {
      toast.info("Mercado Pago está procesando el pago");
      router.replace("/pago/resultado");
      return;
    }
    const message = `Pago rechazado (${result.statusDetail || result.status}). No se realizó ningún cargo.`;
    setPaymentError(message);
    toast.error(message);
  };

  const processPayment = async (payload: Record<string, unknown>) => {
    if (!checkout) throw new Error("No existe un checkout pendiente");
    setPaymentError(undefined);
    setLoading(true);
    try {
      const result = await api<DirectPaymentResult>(
        `/api/v1/payments/${checkout.id}/process`,
        {
          method: "POST",
          idempotencyKey: crypto.randomUUID(),
          body: JSON.stringify(payload),
        },
      );
      await finish(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible procesar el pago";
      setPaymentError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!checkoutId) {
      router.replace(
        session.role === "PENDING_COMPANY" ? "/pago/pendiente" : "/admin/plan",
      );
      return;
    }
    if (!checkout || checkoutStatus !== "PENDING") return;
    if (!publicKey) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadMercadoPago();
        if (cancelled || cardRef.current) return;
        const Constructor = (
          window as typeof window & { MercadoPago?: MercadoPagoConstructor }
        ).MercadoPago;
        if (!Constructor) throw new Error("MercadoPago.js no pudo cargarse");
        const mp = new Constructor(publicKey, { locale: "es-PE" });
        mpRef.current = mp;
        cardRef.current = mp.cardForm({
          amount: String(checkout.amount),
          iframe: true,
          form: {
            id: "mp-card-form",
            cardNumber: {
              id: "mp-card-number",
              placeholder: "Número de tarjeta",
            },
            expirationDate: { id: "mp-expiration", placeholder: "MM/AA" },
            securityCode: { id: "mp-security-code", placeholder: "CVV" },
            cardholderName: {
              id: "mp-cardholder-name",
              placeholder: "Nombre del titular",
            },
            issuer: { id: "mp-issuer", placeholder: "Banco emisor" },
            installments: { id: "mp-installments", placeholder: "Cuotas" },
            identificationType: {
              id: "mp-identification-type",
              placeholder: "Documento",
            },
            identificationNumber: {
              id: "mp-identification-number",
              placeholder: "Número de documento",
            },
            cardholderEmail: {
              id: "mp-cardholder-email",
              placeholder: "correo@empresa.com",
            },
          },
          callbacks: {
            onFormMounted: (error: unknown) => {
              if (error)
                setSdkError("No se pudo iniciar el formulario de tarjeta");
            },
            onSubmit: (event: Event) => {
              event.preventDefault();
              const data = cardRef.current?.getCardFormData();
              if (!data) return;
              void processPayment({
                token: data.token,
                paymentMethodId: data.paymentMethodId,
                issuerId: data.issuerId,
                installments: Number(data.installments) || 1,
                payer: {
                  email: data.cardholderEmail,
                  identification: {
                    type: data.identificationType,
                    number: data.identificationNumber,
                  },
                },
              });
            },
          },
        });
      } catch (error) {
        if (!cancelled)
          setSdkError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar Mercado Pago",
          );
      }
    })();
    return () => {
      cancelled = true;
    };
    // El CardForm debe montarse una sola vez sobre sus iframes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, session?.userId, checkoutId, checkout?.id, checkout?.status]);

  useEffect(() => {
    if (checkoutStatus !== "PENDING") return;
    const select =
      document.querySelector<HTMLSelectElement>("#mp-installments");
    if (!select) return;
    const updateVisibility = () => {
      const supportsFinancing = Array.from(select.options).some(
        (option) => Number(option.value) > 1,
      );
      setShowInstallments(supportsFinancing);
    };
    updateVisibility();
    const observer = new MutationObserver(updateVisibility);
    observer.observe(select, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [checkout?.id, checkoutStatus]);

  const submitYape = async (event: FormEvent) => {
    event.preventDefault();
    if (!mpRef.current) {
      toast.error("Mercado Pago todavía está cargando");
      return;
    }
    if (!/^\d{9}$/.test(phone) || !/^\d{6}$/.test(otp)) {
      toast.error("Ingresa un celular de 9 dígitos y un OTP de 6 dígitos");
      return;
    }
    setLoading(true);
    try {
      const generated = await mpRef.current
        .yape({ phoneNumber: phone, otp })
        .create();
      const token = typeof generated === "string" ? generated : generated.id;
      if (!token) throw new Error("Yape no devolvió un token válido");
      await processPayment({
        token,
        paymentMethodId: "yape",
        installments: 1,
        payer: { email: yapeEmail },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No fue posible validar Yape",
      );
      setLoading(false);
    }
  };

  if (!checkout)
    return (
      <main className="grid min-h-screen place-items-center">
        <Card>
          {checkoutQuery.isError
            ? "No pudimos encontrar este checkout."
            : "Verificando checkout…"}
        </Card>
      </main>
    );
  const closed =
    checkout.status === "FAILED" || checkout.status === "CANCELLED";
  return (
    <main className="min-h-screen bg-[#f4f7f6] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Checkout seguro
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-teal-950">
            Completa el pago de tu plan
          </h1>
          <p className="mt-2 text-slate-600">
            Plan {checkout.plan} ·{" "}
            <strong>
              {checkout.currency} {checkout.amount}
            </strong>
          </p>
        </div>
        {(paymentError || closed) && (
          <Card role="alert" className="mb-5 border-rose-200 bg-rose-50">
            <h2 className="text-xl font-semibold text-rose-950">
              El pago no se completó
            </h2>
            <p className="mt-2 text-sm text-rose-800">
              {paymentError ??
                "Este intento fue rechazado o cancelado. Puedes generar uno nuevo sin perder tu plan actual."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                disabled={restart.isPending}
                onClick={() => restart.mutate()}
              >
                {restart.isPending ? "Preparando…" : "Crear nuevo intento"}
              </Button>
              {checkout.status === "PENDING" && (
                <Button
                  className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  disabled={abandon.isPending}
                  onClick={() => abandon.mutate()}
                >
                  {abandon.isPending ? "Cancelando…" : "Cancelar y volver"}
                </Button>
              )}
              <Button
                className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                onClick={() =>
                  router.push(
                    session?.role === "PENDING_COMPANY"
                      ? "/pago/pendiente"
                      : "/admin/plan",
                  )
                }
              >
                Volver
              </Button>
            </div>
          </Card>
        )}
        {!closed && (
          <div className="mb-5 grid grid-cols-2 gap-3">
            <Button
              type="button"
              className={
                method === "card"
                  ? ""
                  : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              }
              onClick={() => setMethod("card")}
            >
              <CreditCard className="mr-2" size={18} />
              Tarjeta
            </Button>
            <Button
              type="button"
              className={
                method === "yape"
                  ? ""
                  : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              }
              onClick={() => setMethod("yape")}
            >
              <Smartphone className="mr-2" size={18} />
              Yape
            </Button>
          </div>
        )}
        {sdkError && (
          <Card className="mb-5 border-rose-200 bg-rose-50 text-rose-800">
            {sdkError}
          </Card>
        )}
        <Card className={!closed && method === "card" ? "" : "hidden"}>
          <form id="mp-card-form" className="grid gap-4 sm:grid-cols-2">
            <Field label="Número de tarjeta">
              <div id="mp-card-number" className={fieldClass} />
            </Field>
            <Field label="Vencimiento">
              <div id="mp-expiration" className={fieldClass} />
            </Field>
            <Field label="Código de seguridad">
              <div id="mp-security-code" className={fieldClass} />
            </Field>
            <Field label="Nombre del titular">
              <Input id="mp-cardholder-name" autoComplete="cc-name" />
            </Field>
            <Field label="Banco emisor">
              <select id="mp-issuer" className={fieldClass} />
            </Field>
            <div className={showInstallments ? "" : "hidden"}>
              <Field label="Cuotas">
                <select id="mp-installments" className={fieldClass} />
              </Field>
            </div>
            <Field label="Tipo de documento">
              <select id="mp-identification-type" className={fieldClass} />
            </Field>
            <Field label="Número de documento">
              <Input id="mp-identification-number" inputMode="numeric" />
            </Field>
            <Field label="Correo">
              <Input
                id="mp-cardholder-email"
                type="email"
                defaultValue={session?.email}
                autoComplete="email"
              />
            </Field>
            <Button
              id="mp-submit"
              type="submit"
              className="sm:col-span-2"
              disabled={loading || !!sdkError}
            >
              {loading ? "Procesando…" : "Pagar con tarjeta"}
            </Button>
          </form>
        </Card>
        <Card className={!closed && method === "yape" ? "" : "hidden"}>
          <form className="grid gap-4" onSubmit={submitYape}>
            <Field label="Número de celular">
              <Input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
                inputMode="numeric"
                autoComplete="tel"
                placeholder="999999999"
              />
            </Field>
            <Field label="Código de aprobación (OTP)">
              <Input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
              />
            </Field>
            <Field label="Correo">
              <Input
                value={yapeEmail}
                onChange={(e) => setYapeEmail(e.target.value)}
                type="email"
                autoComplete="email"
              />
            </Field>
            <Button type="submit" disabled={loading || !!sdkError}>
              {loading ? "Procesando…" : "Pagar con Yape"}
            </Button>
          </form>
        </Card>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <LockKeyhole size={14} />
          Los datos sensibles se tokenizan directamente con Mercado Pago y no
          pasan por nuestros servidores.
        </p>
      </div>
    </main>
  );
}
