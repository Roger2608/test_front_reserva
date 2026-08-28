"use client";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock3, Copy, Home } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { Badge, Button, Card } from "@/shared/components/ui";
import { dateTime } from "@/shared/lib/utils";
import type { Booking } from "@/shared/types/domain";
export function BookingResult({
  slug,
  token,
}: {
  slug: string;
  token: string;
}) {
  const booking = useQuery({
    queryKey: ["public-booking", slug, token],
    queryFn: () => api<Booking>(`/public/v1/${slug}/bookings/${token}`),
  });
  if (booking.isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        Consultando reserva…
      </div>
    );
  if (!booking.data) throw booking.error;
  const b = booking.data;
  return (
    <main className="grid min-h-screen place-items-center bg-teal-950 p-4">
      <Card className="w-full max-w-lg p-7 md:p-9">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CalendarCheck size={34} />
        </span>
        <div className="mt-5 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Reserva recibida
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-teal-950">
            ¡Todo listo!
          </h1>
          <p className="mt-2 text-slate-500">
            Conserva este enlace para consultar tu reserva.
          </p>
        </div>
        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <Clock3 size={18} className="text-teal-700" />
              {dateTime(b.startAt)}
            </span>
            <Badge tone="amber">{b.status}</Badge>
          </div>
          <p className="mt-3 font-mono text-xs text-slate-500">{b.id}</p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            className="bg-white text-teal-800 ring-1 ring-teal-200 hover:bg-teal-50"
            onClick={() => {
              navigator.clipboard.writeText(location.href);
              toast.success("Enlace copiado");
            }}
          >
            <Copy size={17} /> Copiar enlace
          </Button>
          <Link
            href={`/${slug}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white"
          >
            <Home size={17} /> Volver al inicio
          </Link>
        </div>
      </Card>
    </main>
  );
}
