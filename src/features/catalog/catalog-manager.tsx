"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
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
import type { Location, Resource, Service } from "@/shared/types/domain";
import { money } from "@/shared/lib/utils";

type Kind = "locations" | "services" | "resources";
const labels = {
  locations: ["Sedes", "Nueva sede"],
  services: ["Servicios", "Nuevo servicio"],
  resources: ["Recursos", "Nuevo recurso"],
} as const;
export function CatalogManager({ kind }: { kind: Kind }) {
  const { tenantId } = useTenant();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({
    timezone: "America/Lima",
    durationMinutes: "30",
    price: "0",
    type: "STAFF",
    capacity: "1",
  });
  const [image, setImage] = useState<File>();
  const [editingId, setEditingId] = useState<string>();
  const list = useQuery({
    queryKey: [kind, tenantId],
    queryFn: () =>
      api<(Location | Service | Resource)[]>(`/api/v1/${kind}`, { tenantId }),
    enabled: !!tenantId,
  });
  const locations = useQuery({
    queryKey: ["locations", tenantId],
    queryFn: () => api<Location[]>("/api/v1/locations", { tenantId }),
    enabled: !!tenantId && kind === "resources",
  });
  const save = useMutation({
    mutationFn: (body: unknown) =>
      api<Location | Service | Resource>(
        `/api/v1/${kind}${editingId ? `/${editingId}` : ""}`,
        {
          tenantId,
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(body),
        },
      ),
    onSuccess: async (created) => {
      if (kind === "resources" && image && "type" in created) {
        const payload = new FormData();
        payload.append("image", image);
        await api(`/api/v1/resources/${created.id}/image`, {
          method: "POST",
          body: payload,
        });
      }
      qc.invalidateQueries({ queryKey: [kind, tenantId] });
      toast.success("Guardado correctamente");
      setForm({
        timezone: "America/Lima",
        durationMinutes: "30",
        price: "0",
        type: "STAFF",
        capacity: "1",
      });
      setImage(undefined);
      setEditingId(undefined);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/${kind}/${id}`, { tenantId, method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [kind, tenantId] });
      toast.success("Eliminado correctamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const edit = (item: Location | Service | Resource) => {
    setEditingId(item.id);
    if ("durationMinutes" in item)
      setForm({
        name: item.name,
        description: item.description ?? "",
        durationMinutes: String(item.durationMinutes),
        price: String(item.price),
        timezone: "America/Lima",
        type: "STAFF",
        capacity: "1",
      });
    else if ("type" in item)
      setForm({
        name: item.name,
        locationId: item.locationId,
        type: item.type,
        capacity: String(item.capacity),
        imageUrl: item.imageUrl ?? "",
        bio: item.bio ?? "",
        timezone: "America/Lima",
        durationMinutes: "30",
        price: "0",
      });
    else
      setForm({
        name: item.name,
        address: item.address ?? "",
        timezone: item.timezone,
        durationMinutes: "30",
        price: "0",
        type: "STAFF",
        capacity: "1",
      });
  };
  const uploadExisting = async (id: string, file?: File) => {
    if (!file) return;
    try {
      const payload = new FormData();
      payload.append("image", file);
      await api(`/api/v1/resources/${id}/image`, {
        method: "POST",
        body: payload,
      });
      await qc.invalidateQueries({ queryKey: [kind, tenantId] });
      toast.success("Fotografía actualizada");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo subir la imagen",
      );
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const body =
      kind === "locations"
        ? { name: form.name, address: form.address, timezone: form.timezone }
        : kind === "services"
          ? {
              name: form.name,
              description: form.description,
              durationMinutes: Number(form.durationMinutes),
              price: Number(form.price),
              publicVisible: true,
            }
          : {
              name: form.name,
              locationId: form.locationId,
              type: form.type,
              capacity: Number(form.capacity),
              imageUrl: form.imageUrl || null,
              bio: form.bio || null,
            };
    save.mutate(body);
  };
  if (!tenantId)
    return (
      <Empty
        title="Selecciona una empresa"
        description="Define el tenant activo antes de administrar el catálogo."
      />
    );
  const meta = (item: Location | Service | Resource) => {
    if ("durationMinutes" in item)
      return `${item.durationMinutes} min · ${money(item.price)}`;
    if ("type" in item) return `${item.type} · capacidad ${item.capacity}`;
    return item.address || item.timezone;
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
      <Card>
        <h2 className="text-2xl font-semibold">{labels[kind][0]}</h2>
        <div className="mt-5 grid gap-3">
          {list.data?.length ? (
            list.data.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center gap-3">
                  {"type" in item &&
                    item.type === "STAFF" &&
                    (item.imageUrl ? (
                      <span
                        className="h-12 w-12 shrink-0 rounded-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                      />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 font-bold">
                        {item.name.charAt(0)}
                      </span>
                    ))}
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{meta(item)}</p>
                    {"type" in item && item.type === "STAFF" && (
                      <label className="mt-1 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-teal-700">
                        <ImagePlus size={14} /> Cambiar foto
                        <input
                          className="hidden"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) =>
                            void uploadExisting(item.id, e.target.files?.[0])
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => edit(item)}
                    aria-label="Editar"
                    className="rounded-lg p-2 text-teal-700 hover:bg-teal-50"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirm(`¿Eliminar ${item.name}?`) &&
                      remove.mutate(item.id)
                    }
                    aria-label="Eliminar"
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Aún no hay registros"
              description="Crea el primero desde el formulario."
            />
          )}
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2">
          {editingId ? (
            <Pencil className="text-teal-700" />
          ) : (
            <Plus className="text-teal-700" />
          )}
          <h2 className="text-2xl font-semibold">
            {editingId ? "Editar registro" : labels[kind][1]}
          </h2>
          {editingId && (
            <button
              type="button"
              className="ml-auto rounded-lg p-2"
              onClick={() => setEditingId(undefined)}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <Field label="Nombre">
            <Input
              required
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          {kind === "locations" && (
            <>
              <Field label="Dirección">
                <Input
                  value={form.address || ""}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </Field>
              <Field label="Zona horaria">
                <Input
                  required
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({ ...form, timezone: e.target.value })
                  }
                />
              </Field>
            </>
          )}
          {kind === "services" && (
            <>
              <Field label="Descripción">
                <Input
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duración (min)">
                  <Input
                    type="number"
                    min="5"
                    required
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm({ ...form, durationMinutes: e.target.value })
                    }
                  />
                </Field>
                <Field label="Precio">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </Field>
              </div>
            </>
          )}
          {kind === "resources" && (
            <>
              <Field label="Sede">
                <Select
                  required
                  value={form.locationId || ""}
                  onChange={(e) =>
                    setForm({ ...form, locationId: e.target.value })
                  }
                >
                  <option value="">Seleccionar</option>
                  {locations.data?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tipo">
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="STAFF">Personal / profesional</option>
                    <option value="SPACE">Espacio o ambiente</option>
                    <option value="ASSET">Equipo o activo</option>
                    <option value="CAPACITY">Cupo compartido</option>
                  </Select>
                </Field>
                <Field
                  label={
                    form.type === "CAPACITY" ? "Cupos simultáneos" : "Capacidad"
                  }
                >
                  <Input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                  />
                </Field>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                {form.type === "STAFF"
                  ? "Persona que atiende la cita, por ejemplo un barbero, médico o asesor."
                  : form.type === "SPACE"
                    ? "Ambiente exclusivo que se reserva, por ejemplo una sala, cancha o consultorio."
                    : form.type === "ASSET"
                      ? "Equipo que no puede usarse en dos reservas a la vez, por ejemplo una máquina o vehículo."
                      : "Servicio con varios cupos en el mismo horario, por ejemplo una clase o taller grupal."}
              </div>
              {form.type === "STAFF" && (
                <>
                  <Field label="Fotografía del profesional">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setImage(e.target.files?.[0])}
                    />
                  </Field>
                  <Field label="Presentación breve">
                    <Input
                      value={form.bio || ""}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value })
                      }
                      placeholder="Especialidad, experiencia o estilo de atención"
                    />
                  </Field>
                </>
              )}
            </>
          )}
          <Button disabled={save.isPending}>
            {save.isPending
              ? "Guardando…"
              : editingId
                ? "Actualizar"
                : "Guardar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
