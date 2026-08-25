"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { useTenant } from "@/shared/components/providers";
import { Button, Card, Field, Input, Select } from "@/shared/components/ui";
import type { Branding, Subscription } from "@/shared/types/domain";

type Form = Pick<Branding,"primaryColor"|"accentColor"|"fontPreset"|"themePreset"|"heroTitle"|"heroDescription"|"logoUrl"|"coverUrl"|"buttonStyle">;
const defaults: Form = { primaryColor:"#115e59",accentColor:"#f59e0b",fontPreset:"CLASSIC",themePreset:"EDITORIAL",heroTitle:"",heroDescription:"",logoUrl:"",coverUrl:"",buttonStyle:"ROUNDED" };

export function DesignEditor() {
  const { tenantId, session } = useTenant();
  const branding = useQuery({ queryKey:["branding",tenantId], queryFn:()=>api<Branding>("/api/v1/tenant/branding"), enabled:!!tenantId });
  const subscription = useQuery({ queryKey:["subscription",tenantId], queryFn:()=>api<Subscription>("/api/v1/tenant/subscription"), enabled:!!tenantId });
  if (branding.isLoading || subscription.isLoading) return <Card>Cargando editor…</Card>;
  return <DesignForm key={`${tenantId}-${branding.data?.version}`} initial={{...defaults,...branding.data}} enabled={subscription.data?.canCustomizeDesign??session?.canCustomizeDesign??false} premium={subscription.data?.premiumDesign??session?.plan==="PREMIUM"} tenantName={session?.tenant?.name??"Tu empresa"} tenantId={tenantId}/>;
}

function DesignForm({ initial, enabled, premium, tenantName, tenantId }:{initial:Form;enabled:boolean;premium:boolean;tenantName:string;tenantId:string}) {
  const [form,setForm]=useState<Form>(initial); const qc=useQueryClient();
  const save=useMutation({mutationFn:()=>api<Branding>("/api/v1/tenant/branding",{method:"PUT",body:JSON.stringify(form)}),onSuccess:()=>{qc.invalidateQueries({queryKey:["branding",tenantId]});toast.success("Diseño publicado")},onError:(e:Error)=>toast.error(e.message)});
  const set=<K extends keyof Form>(key:K,value:Form[K])=>setForm(current=>({...current,[key]:value}));
  const submit=(event:FormEvent)=>{event.preventDefault();save.mutate()};
  return <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
    <Card><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold">Identidad visual</h2><p className="mt-1 text-sm text-slate-500">Personaliza sin comprometer la accesibilidad.</p></div>{!enabled&&<LockKeyhole className="text-amber-600"/>}</div>
      {!enabled&&<div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><strong>Disponible desde Plus.</strong><p className="mt-1">Tu página sigue activa con el diseño estándar.</p></div>}
      <form className="mt-6 grid gap-4" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3"><Field label="Color principal"><Input disabled={!enabled} type="color" value={form.primaryColor} onChange={e=>set("primaryColor",e.target.value)}/></Field><Field label="Color de acento"><Input disabled={!enabled} type="color" value={form.accentColor} onChange={e=>set("accentColor",e.target.value)}/></Field></div>
        <Field label="Título"><Input disabled={!enabled} value={form.heroTitle??""} onChange={e=>set("heroTitle",e.target.value)}/></Field>
        <Field label="Descripción"><Input disabled={!enabled} value={form.heroDescription??""} onChange={e=>set("heroDescription",e.target.value)}/></Field>
        <Field label="Logo (HTTPS)"><Input disabled={!enabled} type="url" value={form.logoUrl??""} onChange={e=>set("logoUrl",e.target.value)}/></Field>
        <Field label="Portada (HTTPS)"><Input disabled={!enabled} type="url" value={form.coverUrl??""} onChange={e=>set("coverUrl",e.target.value)}/></Field>
        <Field label="Tipografía"><Select disabled={!enabled} value={form.fontPreset} onChange={e=>set("fontPreset",e.target.value as Form["fontPreset"])}><option value="CLASSIC">Clásica</option><option value="MODERN">Moderna</option><option value="FRIENDLY">Amigable</option></Select></Field>
        <Field label="Composición Premium"><Select disabled={!premium} value={form.themePreset} onChange={e=>set("themePreset",e.target.value as Form["themePreset"])}><option value="EDITORIAL">Editorial</option><option value="MINIMAL">Minimalista</option><option value="BOLD">Audaz</option></Select></Field>
        <Field label="Botones Premium"><Select disabled={!premium} value={form.buttonStyle} onChange={e=>set("buttonStyle",e.target.value as Form["buttonStyle"])}><option value="ROUNDED">Redondeados</option><option value="PILL">Píldora</option><option value="SQUARE">Rectos</option></Select></Field>
        <Button disabled={!enabled||save.isPending}>{save.isPending?"Publicando…":"Publicar diseño"}</Button>
      </form>
    </Card>
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl"><div className="min-h-72 p-8 text-white md:p-12" style={{backgroundColor:form.primaryColor,backgroundImage:form.coverUrl?`linear-gradient(#0008,#0008),url(${form.coverUrl})`:undefined,backgroundSize:"cover"}}>{form.logoUrl&&<span role="img" aria-label="Vista previa del logo" className="mb-8 block h-12 w-48 bg-contain bg-left bg-no-repeat" style={{backgroundImage:`url(${form.logoUrl})`}}/>}<p className="text-xs font-bold uppercase tracking-[.2em]" style={{color:form.accentColor}}>Agenda online</p><h2 className="mt-4 text-5xl font-semibold">{form.heroTitle||tenantName}</h2><p className="mt-4 max-w-lg text-lg opacity-90">{form.heroDescription||"Elige el servicio y encuentra un horario disponible."}</p><button type="button" className={`mt-8 px-5 py-3 font-bold text-slate-950 ${form.buttonStyle==="PILL"?"rounded-full":form.buttonStyle==="SQUARE"?"rounded-none":"rounded-xl"}`} style={{backgroundColor:form.accentColor}}>Reservar ahora</button></div></div>
  </div>;
}
