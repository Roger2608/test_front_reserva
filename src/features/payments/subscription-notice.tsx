"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Clock3 } from "lucide-react";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import type { Subscription } from "@/shared/types/domain";

export function SubscriptionNotice() {
  const { tenantId } = useTenant();
  const query = useQuery({
    queryKey: ["subscription", tenantId],
    queryFn: () => api<Subscription>("/api/v1/tenant/subscription"),
    enabled: !!tenantId,
  });
  const value = query.data;
  if (!value || value.plan === "FREE") return null;
  const trialDays = value.daysRemaining;
  const isTrial = value.status === "TRIAL";
  const paymentRequired = value.status === "TRIAL_PAYMENT_REQUIRED";
  const renewalSoon = value.status === "ACTIVE" && value.renewalEligible;
  if (!isTrial && !paymentRequired && !renewalSoon) return null;
  return (
    <div
      role="status"
      className={`mb-6 flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${paymentRequired || renewalSoon ? "border-amber-300 bg-amber-50" : "border-teal-200 bg-teal-50"}`}
    >
      <div className="flex gap-3">
        {paymentRequired || renewalSoon ? (
          <AlertTriangle className="shrink-0 text-amber-700" />
        ) : (
          <Clock3 className="shrink-0 text-teal-700" />
        )}
        <div>
          <strong className="text-slate-950">
            {paymentRequired
              ? "Tu prueba terminó: conserva tu plan"
              : renewalSoon
                ? "Tu suscripción está por vencer"
                : `${trialDays} ${trialDays === 1 ? "día" : "días"} de prueba disponibles`}
          </strong>
          <p className="mt-1 text-sm text-slate-600">
            {paymentRequired
              ? "Paga ahora o continúa con el plan Free. Tu cuenta seguirá activa durante este periodo."
              : renewalSoon
                ? `Renueva antes del ${format(new Date(value.currentPeriodEnd!), "d 'de' MMMM", { locale: es })} para evitar la suspensión.`
                : `Estás probando ${value.plan} sin cobro. Decide antes de que termine la prueba.`}
          </p>
        </div>
      </div>
      <Link
        href="/admin/plan"
        className="shrink-0 rounded-xl bg-teal-900 px-4 py-2.5 text-center text-sm font-bold text-white"
      >
        {isTrial ? "Ver mi prueba" : "Pagar ahora"}
      </Link>
    </div>
  );
}
