"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  PartyPopper,
  Users,
  X,
} from "lucide-react";
import { useTenant } from "@/shared/components/providers";
import { Button, Card } from "@/shared/components/ui";
import type { Plan } from "@/shared/types/domain";
const benefits: Record<Plan, string[]> = {
  FREE: [
    "Publicar horarios disponibles",
    "Recibir reservas desde tu enlace",
    "Panel operativo con anuncios",
  ],
  BASIC: [
    "Todo lo de Free",
    "Experiencia de reserva sin anuncios",
    "Panel operativo con anuncios",
  ],
  PLUS: [
    "Clientes, fidelización y exportación contable",
    "Confirmaciones automáticas por WhatsApp",
    "Diseño personalizado y panel sin anuncios",
  ],
  PREMIUM: [
    "Todo lo de Plus",
    "Recordatorios automáticos por WhatsApp",
    "Anuncios con logo, portada y HTML",
    "Difusión en la vitrina pública",
  ],
};
export function PlanWelcome() {
  const { session } = useTenant();
  const [visible, setVisible] = useState(false);
  const tenant = session?.tenant;
  const key = tenant ? `turno:onboarding:${tenant.id}:${session.plan}` : "";
  useEffect(() => {
    if (!key || localStorage.getItem(key) === "done") return;
    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, [key]);
  if (!visible || !tenant) return null;
  const close = () => {
    localStorage.setItem(key, "done");
    setVisible(false);
  };
  return (
    <Card className="mb-6 overflow-hidden border-teal-200 bg-gradient-to-br from-white to-teal-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-teal-700">
            <PartyPopper size={18} />
            Bienvenido a turno
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-teal-950">
            Empieza con el plan {session.plan}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Configura {tenant.name} y luego comparte tu enlace de reservas con
            tus clientes.
          </p>
        </div>
        <button
          onClick={close}
          aria-label="Cerrar bienvenida"
          className="rounded-full p-2 text-slate-500 hover:bg-white"
        >
          <X size={20} />
        </button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold">Lo que incluye tu plan</p>
          <ul className="mt-3 grid gap-2">
            {benefits[session.plan].map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-600">
                <Check size={17} className="shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold">Configuración recomendada</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Step
              href="/admin/locations"
              icon={MapPin}
              label="Crear una sede"
            />
            <Step
              href="/admin/services"
              icon={CalendarDays}
              label="Agregar servicios"
            />
            <Step
              href="/admin/resources"
              icon={Users}
              label="Registrar recursos"
            />
            <Step
              href="/admin/availability"
              icon={Clock3}
              label="Definir horarios"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/locations"
          className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white"
        >
          Comenzar
        </Link>
        <Button
          type="button"
          className="bg-white text-teal-800 hover:bg-teal-50"
          onClick={close}
        >
          Lo haré después
        </Button>
      </div>
    </Card>
  );
}
function Step({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl border border-teal-100 bg-white p-3 text-sm font-semibold text-teal-900 hover:border-teal-300"
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}
