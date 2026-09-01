"use client";

import { ArrowRight, Check, Clock3, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const storageKey = "turno.trial-marketing.dismissed";

export function TrialMarketingPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(storageKey) === "true";
    } catch {}
    if (dismissed) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  function close() {
    try {
      sessionStorage.setItem(storageKey, "true");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-popup-title"
        className="relative w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/50 bg-[#f7faf9] p-6 shadow-2xl shadow-slate-950/25 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/35 blur-3xl" />
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar promoción"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-teal-300 hover:text-teal-800"
        >
          <X size={18} />
        </button>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-950 px-3 py-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-200">
            <Clock3 size={15} /> Prueba sin costo
          </span>
          <h2
            id="trial-popup-title"
            className="mt-5 max-w-md text-3xl font-semibold leading-tight text-teal-950 sm:text-4xl"
          >
            Elige cualquier plan y úsalo gratis por 15 días.
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Prueba Basic, Plus o Premium sin pagar hoy. Configura tu negocio,
            comparte tu página y decide al finalizar el periodo de prueba.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-teal-600" /> Sin cobro inicial
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={16} className="text-teal-600" /> Sin tarjeta
            </span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Link
              href="/registro"
              onClick={close}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white transition hover:bg-teal-800"
            >
              Comenzar mis 15 días <ArrowRight size={18} />
            </Link>
            <button
              type="button"
              onClick={close}
              className="min-h-12 rounded-xl px-5 font-bold text-slate-600 transition hover:bg-slate-100 hover:text-teal-900"
            >
              Ahora no
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-400">
            El plan Free continúa disponible sin límite de tiempo.
          </p>
        </div>
      </section>
    </div>
  );
}
