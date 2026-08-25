import type { Metadata } from "next";
import { Providers } from "@/shared/components/providers";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Reservas", template: "%s · Reservas" }, description: "Reservas simples para negocios extraordinarios" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body suppressHydrationWarning><Providers>{children}</Providers></body></html>;
}
