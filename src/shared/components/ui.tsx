import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/shared/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-100", className)} {...props} />;
}
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-3 focus:ring-teal-100", className)} {...props} />;
}
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.06)]", className)} {...props} />;
}
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}{error && <span className="text-xs text-rose-600">{error}</span>}</label>;
}
export function Empty({ title, description }: { title: string; description: string }) {
  return <Card className="py-12 text-center"><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></Card>;
}
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" }) {
  const tones = { slate:"bg-slate-100 text-slate-700", green:"bg-emerald-100 text-emerald-800", amber:"bg-amber-100 text-amber-800", red:"bg-rose-100 text-rose-800" };
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}
