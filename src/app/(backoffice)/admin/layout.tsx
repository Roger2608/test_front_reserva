"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Palette,
  Scissors,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { useTenant } from "@/shared/components/providers";
import { AdminTopAdvertisement } from "@/features/advertising/advertisement-banner";
import { PlanWelcome } from "@/features/onboarding/plan-welcome";

const links = [
  ["/admin", "Resumen", LayoutDashboard],
  ["/admin/tenant", "Empresa", Building2],
  ["/admin/locations", "Sedes", MapPin],
  ["/admin/services", "Servicios", Scissors],
  ["/admin/resources", "Recursos", Users],
  ["/admin/availability", "Horarios", Clock3],
  ["/admin/bookings", "Reservas", CalendarDays],
  ["/admin/diseno", "Diseño", Palette],
  ["/admin/anuncios", "Anuncios", Megaphone],
  ["/admin/plan", "Mi plan", Sparkles],
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const { tenantId, session, ready, logout } = useTenant();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!ready) return;
    if (!session) router.replace("/login");
    else if (session.role === "PLATFORM_ADMIN") router.replace("/plataforma");
    else if (session.subscriptionStatus === "SUSPENDED")
      router.replace("/cuenta-suspendida");
    else if (session.role === "PENDING_COMPANY")
      router.replace("/pago/pendiente");
  }, [ready, session, router]);
  if (
    !ready ||
    !session ||
    !session.tenant ||
    session.role === "PLATFORM_ADMIN" ||
    session.role === "PENDING_COMPANY"
  )
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
        Validando sesión…
      </div>
    );
  const nav = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link href="/" className="text-xl font-extrabold">
          turno<span className="text-emerald-400">.</span>
        </Link>
        <button
          className="lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          <X />
        </button>
      </div>
      <nav className="space-y-1 p-3">
        {links.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white",
              path === href &&
                "bg-white text-teal-950 hover:bg-white hover:text-teal-950",
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 p-4">
        <p className="truncate text-sm font-bold text-white">
          {session.tenant.name}
        </p>
        <p className="mt-1 truncate text-xs text-slate-400">
          Plan {session.plan} · {tenantId.slice(0, 8)}
        </p>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-teal-950 text-white lg:flex">
        {nav}
      </aside>
      {open && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-teal-950 text-white lg:hidden">
          {nav}
        </aside>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-8">
          <button
            className="mr-3 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>
          <p className="text-sm font-semibold text-slate-600">
            Panel de administración
          </p>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <AdminTopAdvertisement />
          <PlanWelcome />
          {children}
        </main>
      </div>
    </div>
  );
}
