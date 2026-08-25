"use client";
import { Button } from "@/shared/components/ui";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="shell grid min-h-screen place-items-center"><div className="max-w-md text-center"><p className="text-sm font-bold uppercase tracking-widest text-rose-700">Algo salió mal</p><h1 className="mt-3 text-4xl font-semibold">No pudimos cargar esta vista</h1><p className="mt-3 text-slate-600">{error.message}</p><Button className="mt-6" onClick={reset}>Intentar nuevamente</Button></div></main>;
}
