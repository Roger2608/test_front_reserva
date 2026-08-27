"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ban, LogOut, Mail } from "lucide-react";
import { useTenant } from "@/shared/components/providers";
import { Card } from "@/shared/components/ui";
export default function SuspendedAccountPage() {
  const { session, ready, logout } = useTenant();
  const router = useRouter();
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
          ni recibir nuevas reservas hasta que el administrador de la plataforma
          reactive la cuenta.
        </p>
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
