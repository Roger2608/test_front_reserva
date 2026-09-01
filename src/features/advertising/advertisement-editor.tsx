"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Select,
} from "@/shared/components/ui";
import type { Advertisement } from "@/shared/types/domain";
import { AdvertisementBanner } from "./advertisement-banner";

const empty = {
  title: "",
  description: "",
  ctaLabel: "Conocer más",
  destinationUrl: "",
  imageUrl: "",
  logoUrl: "",
  coverUrl: "",
  contentMode: "DESIGNED" as const,
  htmlContent: "",
  layoutPreset: "CARD" as const,
  adminDisplaySeconds: 10,
  active: false,
};
type AdForm = Omit<
  Advertisement,
  "id" | "advertiserName" | "imageUrl" | "logoUrl" | "coverUrl" | "htmlContent"
> & {
  imageUrl: string;
  logoUrl: string;
  coverUrl: string;
  htmlContent: string;
};
export function AdvertisementEditor() {
  const { session, tenantId } = useTenant();
  const key = ["tenant-advertisement", tenantId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () =>
      (await api<Advertisement | undefined>("/api/v1/tenant/advertisement")) ??
      null,
    enabled: session?.plan === "PREMIUM" && !!tenantId,
  });
  if (session?.plan !== "PREMIUM")
    return (
      <Card className="max-w-2xl">
        <Megaphone className="text-teal-600" />
        <h2 className="mt-4 text-2xl font-semibold">
          Anuncios para negocios Premium
        </h2>
        <p className="mt-2 text-slate-600">
          Diseña campañas con logo, portada y HTML para la vitrina pública.
        </p>
        <Link
          href="/admin/plan"
          className="mt-5 inline-flex rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white"
        >
          Ver plan Premium
        </Link>
      </Card>
    );
  if (query.isLoading) return <Card>Cargando campaña…</Card>;
  return (
    <Form
      key={query.data?.id ?? "new"}
      initial={query.data ?? empty}
      queryKey={key}
    />
  );
}
function Form({
  initial,
  queryKey,
}: {
  initial: Advertisement | typeof empty;
  queryKey: (string | undefined)[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AdForm>({
    ...empty,
    ...initial,
    logoUrl: initial.logoUrl ?? "",
    coverUrl: initial.coverUrl ?? "",
    htmlContent: initial.htmlContent ?? "",
  });
  const [logo, setLogo] = useState<File>();
  const [cover, setCover] = useState<File>();
  const upload = async (kind: "logo" | "cover", file?: File) => {
    if (!file) return;
    const data = new FormData();
    data.append("image", file);
    return api<Advertisement>(`/api/v1/tenant/advertisement/image/${kind}`, {
      method: "POST",
      body: data,
    });
  };
  const save = useMutation({
    mutationFn: async () => {
      const {
        logoUrl: ignoredLogoUrl,
        coverUrl: ignoredCoverUrl,
        imageUrl: ignoredImageUrl,
        ...content
      } = form;
      void ignoredLogoUrl;
      void ignoredCoverUrl;
      void ignoredImageUrl;
      let value = await api<Advertisement>("/api/v1/tenant/advertisement", {
        method: "PUT",
        body: JSON.stringify(content),
      });
      value = (await upload("logo", logo)) ?? value;
      value = (await upload("cover", cover)) ?? value;
      return value;
    },
    onSuccess: (value) => {
      qc.setQueryData(queryKey, value);
      setForm({
        ...empty,
        ...value,
        logoUrl: value.logoUrl ?? "",
        coverUrl: value.coverUrl ?? "",
        htmlContent: value.htmlContent ?? "",
      });
      setLogo(undefined);
      setCover(undefined);
      toast.success(value.active ? "Campaña publicada" : "Borrador guardado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const preview: Advertisement = {
    id: "preview",
    advertiserName: "Tu empresa",
    ...form,
  };
  const designed = form.contentMode !== "HTML";
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)]">
      <Card>
        <div className="flex justify-between">
          <h2 className="text-2xl font-semibold">Diseño del anuncio</h2>
          <Badge tone={form.active ? "green" : "slate"}>
            {form.active ? "PUBLICADO" : "BORRADOR"}
          </Badge>
        </div>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Formato">
              <Select
                value={form.contentMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contentMode: e.target.value as Advertisement["contentMode"],
                  })
                }
              >
                <option value="DESIGNED">Diseño visual</option>
                <option value="HTML">Solo HTML</option>
                <option value="COMBO">Diseño + HTML</option>
              </Select>
            </Field>
            <Field label="Composición">
              <Select
                value={form.layoutPreset}
                onChange={(e) =>
                  setForm({
                    ...form,
                    layoutPreset: e.target
                      .value as Advertisement["layoutPreset"],
                  })
                }
              >
                <option value="CARD">Tarjeta</option>
                <option value="HERO">Portada hero</option>
                <option value="SPLIT">Imagen dividida</option>
              </Select>
            </Field>
          </div>
          {designed && (
            <>
              <Field label="Título">
                <Input
                  required
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  required
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-sm"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>
            </>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setLogo(e.target.files?.[0])}
              />
            </Field>
            <Field label="Portada">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setCover(e.target.files?.[0])}
              />
            </Field>
          </div>
          {form.contentMode !== "DESIGNED" && (
            <Field label="HTML seguro">
              <textarea
                required
                rows={8}
                maxLength={12000}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs"
                value={form.htmlContent}
                onChange={(e) =>
                  setForm({ ...form, htmlContent: e.target.value })
                }
              />
              <small className="text-slate-500">
                Scripts, iframes y estilos ejecutables se eliminan en el
                servidor.
              </small>
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Texto del botón">
              <Input
                required
                maxLength={40}
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              />
            </Field>
            <Field label="Duración en panel">
              <Input
                required
                type="number"
                min={5}
                max={60}
                value={form.adminDisplaySeconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    adminDisplaySeconds: Number(e.target.value),
                  })
                }
              />
            </Field>
          </div>
          <Field label="URL de destino HTTPS">
            <Input
              required
              type="url"
              value={form.destinationUrl}
              onChange={(e) =>
                setForm({ ...form, destinationUrl: e.target.value })
              }
            />
          </Field>
          <label className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Publicar al guardar
          </label>
          <Button disabled={save.isPending}>
            {save.isPending ? "Guardando y subiendo…" : "Guardar campaña"}
          </Button>
        </form>
      </Card>
      <div>
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">
          Vista previa · {form.layoutPreset.toLowerCase()}
        </p>
        {form.destinationUrl && (form.title || form.htmlContent) ? (
          <AdvertisementBanner advertisement={preview} />
        ) : (
          <Card className="text-sm text-slate-500">
            Completa contenido y enlace para ver la campaña.
          </Card>
        )}
      </div>
    </div>
  );
}
