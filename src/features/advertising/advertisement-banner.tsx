"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Megaphone, X } from "lucide-react";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import type { Advertisement } from "@/shared/types/domain";

export function AdvertisementBanner({
  advertisement,
  compact = false,
  onClose,
}: {
  advertisement: Advertisement;
  compact?: boolean;
  onClose?: () => void;
}) {
  const layout = advertisement.layoutPreset ?? "CARD";
  const cover = advertisement.coverUrl ?? advertisement.imageUrl;
  const html =
    advertisement.contentMode === "HTML" ||
    advertisement.contentMode === "COMBO";
  const content = (
    <>
      <div className="flex items-center gap-2">
        {advertisement.logoUrl && (
          <span
            className="h-10 w-10 shrink-0 rounded-xl bg-white bg-contain bg-center bg-no-repeat shadow"
            style={{ backgroundImage: `url(${advertisement.logoUrl})` }}
          />
        )}
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-teal-700">
          <Megaphone size={13} />
          Publicidad · {advertisement.advertiserName}
        </p>
      </div>
      {advertisement.contentMode !== "HTML" && (
        <>
          <h2
            className={`${compact ? "mt-1 text-base" : "mt-3 text-2xl"} font-semibold text-teal-950`}
          >
            {advertisement.title}
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {advertisement.description}
          </p>
        </>
      )}
      {html && advertisement.htmlContent && (
        <div
          className="prose prose-sm mt-3 max-w-none text-slate-700"
          dangerouslySetInnerHTML={{ __html: advertisement.htmlContent }}
        />
      )}
      <a
        href={advertisement.destinationUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white"
      >
        {advertisement.ctaLabel}
        <ArrowUpRight size={16} />
      </a>
    </>
  );
  return (
    <aside
      aria-label={`Publicidad de ${advertisement.advertiserName}`}
      className={`relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-teal-50 shadow-sm ${layout === "HERO" ? "min-h-64" : layout === "SPLIT" ? "" : ""}`}
    >
      {layout === "HERO" ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
          />
          <div className={`relative max-w-2xl ${compact ? "p-4" : "p-8"}`}>
            {content}
          </div>
        </>
      ) : layout === "SPLIT" ? (
        <div className="grid min-h-52 md:grid-cols-2">
          <div
            className="min-h-44 bg-slate-200 bg-cover bg-center"
            style={cover ? { backgroundImage: `url(${cover})` } : undefined}
          />
          <div className={compact ? "p-4" : "p-6"}>{content}</div>
        </div>
      ) : (
        <div
          className={`grid items-center gap-4 ${cover ? "sm:grid-cols-[140px_1fr]" : ""} ${compact ? "p-3" : "p-5"}`}
        >
          {cover && (
            <div
              className="aspect-[4/3] rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${cover})` }}
            />
          )}
          <div>{content}</div>
        </div>
      )}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Cerrar publicidad"
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm"
        >
          <X size={15} />
        </button>
      )}
    </aside>
  );
}

export function CustomerBookingAdvertisement({
  slug,
  enabled,
  reserve,
}: {
  slug: string;
  enabled: boolean;
  reserve: boolean;
}) {
  const ad = useQuery({
    queryKey: ["advertisement", "customer", slug],
    queryFn: async () =>
      (await api<Advertisement | undefined>(
        `/public/v1/advertisements/slot/${slug}?placement=CUSTOMER_BOOKING`,
      )) ?? null,
    enabled,
    retry: false,
  });
  if (reserve || (enabled && ad.isLoading))
    return (
      <div
        className="mt-6 min-h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/70"
        aria-label="Cargando espacio publicitario"
      />
    );
  return (
    <div className="mt-6 min-h-0" aria-live="polite">
      {ad.data && <AdvertisementBanner advertisement={ad.data} />}
    </div>
  );
}

export function AdminTopAdvertisement() {
  const { session, tenantId } = useTenant();
  const eligible = session?.plan === "FREE" || session?.plan === "BASIC";
  const ad = useQuery({
    queryKey: ["advertisement", "admin", tenantId],
    queryFn: async () =>
      (await api<Advertisement | undefined>(
        "/api/v1/advertisements/admin-slot",
      )) ?? null,
    enabled: eligible && !!tenantId,
    retry: false,
  });
  if (!ad.data) return null;
  return (
    <TimedAdminAdvertisement
      key={`${tenantId}-${ad.data.id}`}
      advertisement={ad.data}
    />
  );
}

function TimedAdminAdvertisement({
  advertisement,
}: {
  advertisement: Advertisement;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(
      () => setVisible(false),
      advertisement.adminDisplaySeconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [advertisement.adminDisplaySeconds, visible]);
  if (!visible) return null;
  return (
    <div className="mb-5">
      <AdvertisementBanner
        compact
        advertisement={advertisement}
        onClose={() => setVisible(false)}
      />
    </div>
  );
}
