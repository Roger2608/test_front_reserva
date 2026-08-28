import { Suspense } from "react";
import { ResetPassword } from "@/features/auth/password-recovery";
export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center">Cargando…</main>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
