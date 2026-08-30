import type { Checkout } from "@/shared/types/domain";

export function checkoutPath(checkout: Checkout): string {
  if (checkout.checkoutUrl) {
    try {
      const url = new URL(checkout.checkoutUrl, "https://turno.local");
      if (url.pathname === "/pago/simulado")
        return `/pago/simulado?checkout=${encodeURIComponent(checkout.id)}`;
    } catch {
      // La ruta local de checkout sigue siendo una alternativa segura.
    }
  }
  return `/pago/checkout?checkout=${encodeURIComponent(checkout.id)}`;
}
