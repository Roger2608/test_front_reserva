"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import {
  Button,
  Card,
  Empty,
  Field,
  Input,
  Select,
} from "@/shared/components/ui";
import type { AvailabilityRule, Resource } from "@/shared/types/domain";
const days = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const initial = {
  resourceId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "18:00",
};
export function RuleManager() {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(initial);
  const resources = useQuery({
    queryKey: ["resources", tenantId],
    queryFn: () => api<Resource[]>("/api/v1/resources", { tenantId }),
    enabled: !!tenantId,
  });
  const rules = useQuery({
    queryKey: ["availability-rules", tenantId],
    queryFn: () =>
      api<AvailabilityRule[]>("/api/v1/availability/rules", { tenantId }),
    enabled: !!tenantId,
  });
  const payload = () =>
    JSON.stringify({
      ...form,
      dayOfWeek: Number(form.dayOfWeek),
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`,
    });
  const save = useMutation({
    mutationFn: () =>
      api(
        editing
          ? `/api/v1/availability/rules/${editing}`
          : "/api/v1/availability/rules",
        { tenantId, method: editing ? "PUT" : "POST", body: payload() },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-rules", tenantId] });
      setEditing(null);
      setForm(initial);
      toast.success("Horario guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/availability/rules/${id}`, { tenantId, method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["availability-rules", tenantId] });
      toast.success("Horario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!tenantId)
    return (
      <Empty
        title="Inicia sesión"
        description="Necesitamos conocer tu empresa."
      />
    );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };
  const edit = (rule: AvailabilityRule) => {
    setEditing(rule.id);
    setForm({
      resourceId: rule.resourceId,
      dayOfWeek: String(rule.dayOfWeek),
      startTime: rule.startTime.slice(0, 5),
      endTime: rule.endTime.slice(0, 5),
    });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <Card>
        <h2 className="text-2xl font-semibold">Cobertura semanal</h2>
        <p className="mt-2 text-slate-600">
          Estos intervalos generan los horarios que ven tus clientes.
        </p>
        <div className="mt-6 grid gap-3">
          {rules.data?.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-bold">{days[rule.dayOfWeek - 1]}</p>
                <p className="text-sm text-slate-500">
                  {rule.startTime.slice(0, 5)}–{rule.endTime.slice(0, 5)} ·{" "}
                  {resources.data?.find((r) => r.id === rule.resourceId)
                    ?.name ?? "Recurso"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => edit(rule)}
                  aria-label="Editar horario"
                  className="rounded-lg border p-2 text-teal-700"
                >
                  <Pencil size={17} />
                </button>
                <button
                  onClick={() => remove.mutate(rule.id)}
                  aria-label="Eliminar horario"
                  className="rounded-lg border p-2 text-rose-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
          {!rules.isLoading && !rules.data?.length && (
            <Empty
              title="Sin horarios"
              description="Agrega el primer intervalo semanal."
            />
          )}
        </div>
      </Card>
      <Card>
        <h2 className="text-2xl font-semibold">
          {editing ? "Editar horario" : "Agregar horario"}
        </h2>
        <form className="mt-5 grid gap-4" onSubmit={submit}>
          <Field label="Recurso">
            <Select
              required
              value={form.resourceId}
              onChange={(e) => setForm({ ...form, resourceId: e.target.value })}
            >
              <option value="">Seleccionar</option>
              {resources.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Día">
            <Select
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            >
              {days.map((d, i) => (
                <option key={d} value={i + 1}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde">
              <Input
                required
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
            </Field>
            <Field label="Hasta">
              <Input
                required
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </Field>
          </div>
          <Button disabled={save.isPending}>
            {editing ? "Actualizar" : "Guardar horario"}
          </Button>
          {editing && (
            <button
              type="button"
              className="text-sm font-bold text-slate-500"
              onClick={() => {
                setEditing(null);
                setForm(initial);
              }}
            >
              Cancelar edición
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
