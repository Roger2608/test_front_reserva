"use client";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { api } from "@/shared/api/client";
import { Card, Empty } from "@/shared/components/ui";
import { money } from "@/shared/lib/utils";
import type { Location, PublicSite, Service } from "@/shared/types/domain";

export function PublicCatalog({ slug }: { slug: string }) {
  const site = useQuery({
    queryKey: ["public-site", slug],
    queryFn: () => api<PublicSite>(`/public/v1/${slug}/site`),
  });
  const locations = useQuery({
    queryKey: ["public-locations", slug],
    queryFn: () => api<Location[]>(`/public/v1/${slug}/locations`),
  });
  const services = useQuery({
    queryKey: ["public-services", slug],
    queryFn: () => api<Service[]>(`/public/v1/${slug}/services`),
  });
  if (site.isError)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f5ef] p-5">
        <Empty
          title="Empresa no encontrada"
          description="Revisa que el enlace sea correcto o solicita uno nuevo."
        />
      </main>
    );
  const branding = site.data?.branding;
  const tenant = site.data?.tenant;
  const radius =
    branding?.buttonStyle === "PILL"
      ? "999px"
      : branding?.buttonStyle === "SQUARE"
        ? "0"
        : ".75rem";
  const font =
    branding?.fontPreset === "MODERN"
      ? 'Inter,"Segoe UI",sans-serif'
      : branding?.fontPreset === "FRIENDLY"
        ? 'Nunito,"Segoe UI",sans-serif'
        : "Georgia,serif";
  return (
    <main
      className="brand-typography min-h-screen bg-[#f7f5ef]"
      style={
        {
          "--brand": branding?.primaryColor ?? "#115e59",
          "--accent": branding?.accentColor ?? "#f59e0b",
          "--brand-font": font,
        } as React.CSSProperties
      }
    >
      <header className="shell flex h-20 items-center justify-between">
        {branding?.logoUrl ? (
          <span
            className="h-10 w-40 bg-contain bg-left bg-no-repeat"
            role="img"
            aria-label={tenant?.name}
            style={{ backgroundImage: `url(${branding.logoUrl})` }}
          />
        ) : (
          <span className="font-extrabold" style={{ color: "var(--brand)" }}>
            {tenant?.name ?? "turno."}
          </span>
        )}
        <Link
          href={`/${slug}/reservar`}
          className="px-4 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: "var(--brand)", borderRadius: radius }}
        >
          Reservar
        </Link>
      </header>
      <section
        className="border-y py-16 text-white"
        style={{
          backgroundColor: "var(--brand)",
          backgroundImage: branding?.coverUrl
            ? `linear-gradient(#0008,#0008),url(${branding.coverUrl})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`shell ${branding?.themePreset === "MINIMAL" ? "text-center" : ""}`}
        >
          <p
            className="text-sm font-bold uppercase tracking-[.2em]"
            style={{ color: "var(--accent)" }}
          >
            Agenda online
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold md:text-6xl">
            {branding?.heroTitle || tenant?.name || slug.replaceAll("-", " ")}
          </h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">
            {branding?.heroDescription ||
              "Elige el servicio y encuentra un horario disponible en tiempo real."}
          </p>
        </div>
      </section>
      <section className="shell py-14">
        <div>
          <p
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--brand)" }}
          >
            Catálogo
          </p>
          <h2 className="mt-2 text-4xl font-semibold">Nuestros servicios</h2>
        </div>
        <div
          className={`mt-7 grid gap-5 ${branding?.themePreset === "BOLD" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}
        >
          {services.data?.map((s) => (
            <Card key={s.id} className="group flex flex-col">
              <div className="flex-1">
                <p
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--brand)" }}
                >
                  Servicio
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {s.description ||
                    "Atención personalizada con reserva previa."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock3 size={16} />
                  {s.durationMinutes} min
                </span>
                <strong>{money(s.price, tenant?.currency)}</strong>
              </div>
              <Link
                href={`/${slug}/reservar?serviceId=${s.id}`}
                className="mt-4 flex items-center justify-between px-4 py-3 text-sm font-bold text-white"
                style={{
                  backgroundColor: "var(--brand)",
                  borderRadius: radius,
                }}
              >
                Elegir servicio <ArrowRight size={17} />
              </Link>
            </Card>
          ))}
        </div>
        {!services.isLoading && !services.data?.length && (
          <Empty
            title="Sin servicios publicados"
            description="Este negocio todavía está preparando su catálogo."
          />
        )}
        <div className="mt-14">
          <h2 className="text-3xl font-semibold">Dónde encontrarnos</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {locations.data?.map((l) => (
              <Card key={l.id} className="flex gap-4">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb,var(--accent) 25%,white)",
                    color: "var(--brand)",
                  }}
                >
                  <MapPin size={20} />
                </span>
                <div>
                  <h3 className="font-bold">{l.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {l.address || l.timezone}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
