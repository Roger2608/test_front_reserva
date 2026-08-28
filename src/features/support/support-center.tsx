"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp, Clock3, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Select,
} from "@/shared/components/ui";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  description: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  adminResponse?: string;
  createdAt: string;
};

const planPriority = {
  BASIC: ["Prioridad normal", "Atención en el orden habitual"],
  PLUS: ["Prioridad alta", "Tu consulta se atiende antes que las de Basic"],
  PREMIUM: ["Prioridad urgente", "Máxima prioridad en la cola de soporte"],
} as const;

const labels: Record<string, string> = {
  QUESTION: "Consulta",
  INCIDENT: "Problema técnico",
  BILLING: "Facturación",
  SUGGESTION: "Sugerencia",
  OPEN: "Abierto",
  IN_PROGRESS: "En atención",
  RESOLVED: "Resuelto",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function SupportCenter() {
  const { session, tenantId } = useTenant();
  const qc = useQueryClient();
  const [category, setCategory] = useState("QUESTION");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const plan = session?.plan ?? "FREE";
  const enabled = plan !== "FREE";
  const tickets = useQuery({
    queryKey: ["support", tenantId],
    queryFn: () => api<Ticket[]>("/api/v1/support"),
    enabled: Boolean(tenantId && enabled),
  });
  const create = useMutation({
    mutationFn: () =>
      api<Ticket>("/api/v1/support", {
        method: "POST",
        body: JSON.stringify({ category, subject, description }),
      }),
    onSuccess: () => {
      setSubject("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["support", tenantId] });
      toast.success("Solicitud enviada a soporte");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!enabled) {
    return (
      <Card className="mx-auto max-w-3xl py-12 text-center">
        <CircleHelp className="mx-auto text-teal-700" size={42} />
        <h1 className="mt-4 text-3xl font-semibold">Soporte para tu negocio</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">
          El envío y seguimiento de consultas está disponible desde el plan
          Basic.
        </p>
        <Link
          href="/admin/plan"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white"
        >
          Conocer los planes
        </Link>
      </Card>
    );
  }

  const priority =
    planPriority[plan as keyof typeof planPriority] ?? planPriority.BASIC;
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
            Ayuda y soporte
          </p>
          <h1 className="mt-1 text-4xl font-semibold">
            ¿Cómo podemos ayudarte?
          </h1>
          <p className="mt-2 text-slate-500">
            Envía una consulta o reporta un problema y sigue la respuesta aquí.
          </p>
        </div>
        <Card className="flex items-center gap-3 py-3">
          <Clock3 className="text-teal-700" />
          <div>
            <p className="font-bold">{priority[0]}</p>
            <p className="text-xs text-slate-500">{priority[1]}</p>
          </div>
        </Card>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <Card className="h-fit">
          <h2 className="text-xl font-semibold">Nueva solicitud</h2>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <Field label="Tipo de solicitud">
              <Select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="QUESTION">Consulta</option>
                <option value="INCIDENT">Problema técnico</option>
                <option value="BILLING">Facturación</option>
                <option value="SUGGESTION">Sugerencia</option>
              </Select>
            </Field>
            <Field label="Asunto">
              <Input
                maxLength={160}
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Describe brevemente lo que necesitas"
              />
            </Field>
            <Field label="Detalle">
              <textarea
                className="min-h-36 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-sm outline-none focus:border-teal-600 focus:ring-3 focus:ring-teal-100"
                maxLength={4000}
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Incluye los pasos, el resultado esperado y cualquier dato útil."
              />
            </Field>
            <Button
              disabled={
                create.isPending || !subject.trim() || !description.trim()
              }
            >
              <Send size={17} className="mr-2" />
              {create.isPending ? "Enviando…" : "Enviar a soporte"}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Mis solicitudes</h2>
          {tickets.isLoading ? (
            <Card>Cargando solicitudes…</Card>
          ) : tickets.data?.length ? (
            <div className="grid gap-4">
              {tickets.data.map((ticket) => (
                <Card key={ticket.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                        {labels[ticket.category]}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {ticket.subject}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        tone={
                          ticket.priority === "URGENT"
                            ? "red"
                            : ticket.priority === "HIGH"
                              ? "amber"
                              : "slate"
                        }
                      >
                        {labels[ticket.priority]}
                      </Badge>
                      <Badge
                        tone={ticket.status === "RESOLVED" ? "green" : "slate"}
                      >
                        {labels[ticket.status]}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                    {ticket.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    Enviado el{" "}
                    {new Date(ticket.createdAt).toLocaleString("es-PE")}
                  </p>
                  {ticket.adminResponse && (
                    <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
                        <MessageSquareText size={17} /> Respuesta de soporte
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-teal-950">
                        {ticket.adminResponse}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              title="Aún no tienes solicitudes"
              description="Cuando necesites ayuda, tu conversación aparecerá en este espacio."
            />
          )}
        </div>
      </div>
    </section>
  );
}
