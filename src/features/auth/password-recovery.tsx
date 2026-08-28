"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { api } from "@/shared/api/client";
import { Button, Card, Field, Input } from "@/shared/components/ui";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const request = useMutation({
    mutationFn: () =>
      api("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        noRefresh: true,
      }),
    onSuccess: () => setSent(true),
  });
  return (
    <Shell>
      {sent ? (
        <>
          <CheckCircle2 className="text-emerald-600" size={42} />
          <h1 className="mt-5 text-3xl font-semibold">Revisa tu correo</h1>
          <p className="mt-3 text-slate-600">
            Si existe una cuenta asociada a <strong>{email}</strong>, recibirás
            un enlace válido durante 30 minutos.
          </p>
        </>
      ) : (
        <>
          <Mail className="text-teal-700" size={38} />
          <h1 className="mt-5 text-3xl font-semibold">
            Recupera tu contraseña
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Escribe el correo con el que registraste tu empresa.
          </p>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              request.mutate();
            }}
          >
            <Field label="Correo">
              <Input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button disabled={request.isPending}>
              {request.isPending ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
        </>
      )}
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-bold text-teal-700"
      >
        Volver al inicio de sesión
      </Link>
    </Shell>
  );
}

export function ResetPassword() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const reset = useMutation({
    mutationFn: () =>
      api("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
        noRefresh: true,
      }),
  });
  const valid = password.length >= 8 && password === confirmation;
  if (reset.isSuccess)
    return (
      <Shell>
        <CheckCircle2 className="text-emerald-600" size={42} />
        <h1 className="mt-5 text-3xl font-semibold">Contraseña actualizada</h1>
        <p className="mt-3 text-slate-600">
          Ya puedes ingresar con tu nueva contraseña.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white"
        >
          Ingresar
        </Link>
      </Shell>
    );
  return (
    <Shell>
      <KeyRound className="text-teal-700" size={38} />
      <h1 className="mt-5 text-3xl font-semibold">Crea una nueva contraseña</h1>
      {!token ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
          El enlace no contiene un token válido. Solicita uno nuevo.
        </p>
      ) : (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (valid) reset.mutate();
          }}
        >
          <Field label="Nueva contraseña">
            <Input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field
            label="Repite la contraseña"
            error={
              confirmation && password !== confirmation
                ? "Las contraseñas no coinciden"
                : undefined
            }
          >
            <Input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Field>
          {reset.isError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {reset.error.message}
            </p>
          )}
          <Button disabled={!valid || reset.isPending}>
            {reset.isPending ? "Actualizando…" : "Cambiar contraseña"}
          </Button>
        </form>
      )}
      <Link
        href="/olvide-contrasena"
        className="mt-6 inline-block text-sm font-bold text-teal-700"
      >
        Solicitar otro enlace
      </Link>
    </Shell>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7f6] p-4">
      <Card className="w-full max-w-md p-8">
        <Link
          href="/"
          className="mb-8 block text-xl font-extrabold text-teal-950"
        >
          turno<span className="text-teal-600">.</span>
        </Link>
        {children}
      </Card>
    </main>
  );
}
