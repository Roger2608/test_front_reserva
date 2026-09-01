"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Check, Clock3 } from "lucide-react";
import { api } from "@/shared/api/client";
import { hasCachedSession, useTenant } from "@/shared/components/providers";
import { Button, Card, Field, Input, Select } from "@/shared/components/ui";
import type { Plan, Session } from "@/shared/types/domain";
const loginSchema = z.object({
  email: z.email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
const registerSchema = loginSchema.extend({
  fullName: z.string().min(2),
  companyName: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  plan: z.enum(["FREE", "BASIC", "PLUS", "PREMIUM"]),
});
type Login = z.infer<typeof loginSchema>;
type Register = z.infer<typeof registerSchema>;
const planLabel: Record<Plan, string> = {
  FREE: "FREE · sin pago",
  BASIC: "BASIC · S/ 39",
  PLUS: "PLUS · S/ 79",
  PREMIUM: "PREMIUM · S/ 149",
};
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { setAuth } = useTenant();
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<Login | Register>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "login"
        ? { email: "", password: "" }
        : {
            email: "",
            password: "",
            fullName: "",
            companyName: "",
            slug: "",
            plan: "FREE",
          },
  });
  const mutation = useMutation({
    mutationFn: (values: Login | Register) =>
      api<Session>(`/api/v1/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "register"
            ? { ...values, timezone: "America/Lima", currency: "PEN" }
            : { ...values, validateSubscription: !hasCachedSession() },
        ),
        noRefresh: true,
      }),
    onSuccess: (session) => {
      setAuth(session);
      toast.success(
        mode === "login"
          ? "Bienvenido de nuevo"
          : session.role === "PENDING_COMPANY"
            ? "Continúa con el pago"
            : "Tu empresa ya tiene una página pública",
      );
      router.push(
        session.role === "PLATFORM_ADMIN"
          ? "/plataforma"
          : session.subscriptionStatus === "SUSPENDED"
            ? "/cuenta-suspendida"
            : session.role === "PENDING_COMPANY"
              ? "/pago/pendiente"
              : "/admin",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f6] p-4">
      <Card className="w-full max-w-lg p-7">
        <Link href="/" className="text-xl font-extrabold text-teal-950">
          turno<span className="text-teal-600">.</span>
        </Link>
        <h1 className="mt-8 text-4xl font-semibold text-teal-950">
          {mode === "login"
            ? "Ingresa a tu empresa"
            : "Crea tu página de reservas"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "login"
            ? "Administra horarios, reservas y diseño."
            : "Elige cualquier plan y pruébalo 15 días sin cobro ni tarjeta."}
        </p>
        {mode === "register" && (
          <aside
            role="note"
            aria-label="Beneficio de prueba gratis"
            className="mt-6 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50/80"
          >
            <div className="flex gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-950 text-emerald-200">
                <Clock3 size={19} />
              </span>
              <div>
                <p className="font-bold text-teal-950">
                  Basic, Plus y Premium: 15 días gratis
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  No pagas hoy ni necesitas tarjeta. Explora todas las funciones
                  del plan elegido y decide al terminar tu prueba.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-teal-800">
                  <span className="flex items-center gap-1">
                    <Check size={14} /> Sin cobro inicial
                  </span>
                  <span className="flex items-center gap-1">
                    <Check size={14} /> Free siempre disponible
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
        <form
          className="mt-7 grid gap-4"
          onSubmit={form.handleSubmit((value) => mutation.mutate(value))}
        >
          {mode === "register" && (
            <>
              <Field label="Tu nombre">
                <Input {...form.register("fullName" as keyof Register)} />
              </Field>
              <Field label="Nombre de la empresa">
                <Input {...form.register("companyName" as keyof Register)} />
              </Field>
              <Field label="Enlace público">
                <div className="flex items-center rounded-xl border border-slate-300 bg-white pl-3 text-sm text-slate-400">
                  <span>/</span>
                  <Input
                    className="border-0 focus:ring-0"
                    placeholder="mi-negocio"
                    {...form.register("slug" as keyof Register)}
                  />
                </div>
              </Field>
              <Field label="Plan">
                <Select {...form.register("plan" as keyof Register)}>
                  {(["FREE", "BASIC", "PLUS", "PREMIUM"] as Plan[]).map(
                    (plan) => (
                      <option value={plan} key={plan}>
                        {planLabel[plan]}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </>
          )}
          <Field label="Correo">
            <Input
              type="email"
              autoComplete="email"
              {...form.register("email")}
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              {...form.register("password")}
            />
          </Field>
          {mode === "login" && (
            <Link
              href="/olvide-contrasena"
              className="-mt-2 text-right text-sm font-bold text-teal-700"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          )}
          <Button disabled={mutation.isPending}>
            {mutation.isPending
              ? "Procesando…"
              : mode === "login"
                ? "Ingresar"
                : "Crear empresa"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              ¿Aún no tienes cuenta?{" "}
              <Link className="font-bold text-teal-700" href="/registro">
                Regístrate
              </Link>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link className="font-bold text-teal-700" href="/login">
                Ingresa
              </Link>
            </>
          )}
        </p>
      </Card>
    </main>
  );
}
