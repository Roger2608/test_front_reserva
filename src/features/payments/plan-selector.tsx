"use client";

import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {Check,ExternalLink,LockKeyhole,Sparkles} from "lucide-react";
import {toast} from "sonner";
import {api} from "@/shared/api/client";
import {useTenant} from "@/shared/components/providers";
import {Badge,Button,Card} from "@/shared/components/ui";
import type {Checkout,Plan,PlanPrice,Session,Subscription} from "@/shared/types/domain";

const details:Record<Plan,{name:string;description:string;features:string[]}>= {
  FREE:{name:"Gratis",description:"Agenda y reservas para comenzar.",features:["Horarios y reservas","Anuncios en reserva y panel","Sin automatización WhatsApp"]},
  BASIC:{name:"Básico",description:"Una experiencia limpia para tus clientes.",features:["Clientes sin anuncios","Anuncios solo en panel","Sin automatización WhatsApp"]},
  PLUS:{name:"Plus",description:"Marca propia y confirmaciones automáticas.",features:["Sin anuncios","Diseño personalizado","Confirmación por WhatsApp"]},
  PREMIUM:{name:"Premium",description:"Automatización y promoción para crecer.",features:["Confirmación y recordatorio","Publica tus anuncios","Vitrina pública de campañas"]},
};
const order:Plan[]=["FREE","BASIC","PLUS","PREMIUM"];

export function PlanSelector(){
  const {session,setAuth}=useTenant();
  const queryClient=useQueryClient();
  const [confirmFree,setConfirmFree]=useState(false);
  const subscription=useQuery({queryKey:["subscription",session?.tenant?.id],queryFn:()=>api<Subscription>("/api/v1/tenant/subscription"),enabled:!!session?.tenant});
  const prices=useQuery({queryKey:["plan-prices"],queryFn:()=>api<PlanPrice[]>("/api/v1/payments/plans"),enabled:!!session?.tenant});
  const refresh=async()=>{const next=await api<Session>("/api/v1/auth/refresh",{method:"POST",noRefresh:true});setAuth(next);await queryClient.invalidateQueries({queryKey:["subscription"]});};
  const checkout=useMutation({mutationFn:(plan:Plan)=>api<Checkout>("/api/v1/payments/checkout",{method:"POST",body:JSON.stringify({plan})}),onSuccess:(next)=>{if(session)setAuth({...session,checkout:next});if(next.checkoutUrl)window.location.assign(next.checkoutUrl);else toast.error("El proveedor no devolvió una URL de pago")},onError:(error:Error)=>toast.error(error.message)});
  const downgrade=useMutation({mutationFn:()=>api<void>("/api/v1/payments/change-to-free",{method:"POST"}),onSuccess:async()=>{await refresh();setConfirmFree(false);toast.success("Tu plan ahora es Gratis")},onError:(error:Error)=>toast.error(error.message)});
  const current=subscription.data?.plan??session?.plan;
  const pending=subscription.data?.pendingCheckout;
  const owner=session?.role==="TENANT_OWNER";
  const priceFor=(plan:Plan)=>prices.data?.find(item=>item.plan===plan);
  const money=(plan:Plan)=>{const value=priceFor(plan);return !value||value.amount===0?"Gratis":new Intl.NumberFormat("es-PE",{style:"currency",currency:value.currency,maximumFractionDigits:0}).format(value.amount)+" / 30 días"};

  return <>
    <div className="mb-7"><p className="text-sm font-bold uppercase tracking-widest text-teal-700">Suscripción</p><h1 className="mt-2 text-4xl font-semibold text-teal-950">Elige el plan de tu empresa</h1><p className="mt-2 max-w-2xl text-slate-600">Tu plan actual seguirá activo hasta que Mercado Pago confirme el nuevo pago.</p></div>
    {subscription.isLoading||prices.isLoading?<Card aria-live="polite">Cargando planes…</Card>:subscription.isError||prices.isError?<Card className="border-rose-200 text-rose-700">No pudimos cargar los planes. Intenta nuevamente.</Card>:<>
      {pending&&<Card className="mb-6 flex flex-col items-start justify-between gap-4 border-amber-200 bg-amber-50 sm:flex-row sm:items-center"><div><Badge tone="amber">PAGO PENDIENTE</Badge><p className="mt-2 font-semibold text-slate-950">Cambio al plan {details[pending.plan].name}</p><p className="text-sm text-slate-600">Completa este pago antes de seleccionar otro plan.</p></div>{pending.checkoutUrl&&<Button onClick={()=>window.location.assign(pending.checkoutUrl!)}>Continuar pago <ExternalLink className="ml-2" size={16}/></Button>}</Card>}
      {!owner&&<Card className="mb-6 flex gap-3 bg-slate-50"><LockKeyhole className="shrink-0 text-slate-500"/><p className="text-sm text-slate-600">Solo el propietario de la empresa puede cambiar el plan. Puedes consultar aquí sus beneficios y estado.</p></Card>}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">{order.map(plan=>{const active=current===plan;const isPending=pending?.plan===plan;return <Card key={plan} aria-current={active?"true":undefined} className={plan==="PLUS"?"border-teal-300 ring-2 ring-teal-100":""}><div className="flex min-h-7 items-center justify-between">{plan==="PLUS"?<span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-teal-700"><Sparkles size={14}/>Recomendado</span>:<span/>}{active&&<Badge tone="green">PLAN ACTUAL</Badge>}</div><h2 className="mt-4 text-2xl font-semibold text-teal-950">{details[plan].name}</h2><p className="mt-1 min-h-12 text-sm text-slate-500">{details[plan].description}</p><p className="mt-5 text-xl font-bold text-slate-950">{money(plan)}</p><ul className="my-6 grid gap-3 text-sm text-slate-700">{details[plan].features.map(feature=><li className="flex gap-2" key={feature}><Check className="shrink-0 text-emerald-600" size={17}/>{feature}</li>)}</ul><Button className="w-full" disabled={!owner||active||!!pending||checkout.isPending||downgrade.isPending} onClick={()=>plan==="FREE"?setConfirmFree(true):checkout.mutate(plan)}>{active?"Plan actual":isPending?"Pago pendiente":`Cambiar a ${details[plan].name}`}</Button></Card>})}</div>
      {confirmFree&&<Card role="alertdialog" aria-labelledby="free-plan-title" className="mt-6 max-w-2xl border-amber-300 bg-amber-50"><h2 id="free-plan-title" className="text-xl font-semibold text-slate-950">¿Cambiar al plan Gratis?</h2><p className="mt-2 text-sm leading-6 text-slate-700">El cambio es inmediato. Tu página y reservas seguirán activas, pero perderás las opciones de personalización visual de Plus o Premium.</p><div className="mt-5 flex flex-wrap gap-3"><Button className="bg-rose-700 hover:bg-rose-800" disabled={downgrade.isPending} onClick={()=>downgrade.mutate()}>{downgrade.isPending?"Aplicando…":"Sí, cambiar a Gratis"}</Button><Button className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50" disabled={downgrade.isPending} onClick={()=>setConfirmFree(false)}>Cancelar</Button></div></Card>}
    </>}
  </>;
}
