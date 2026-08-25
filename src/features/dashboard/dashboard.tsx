"use client";
import {useQuery} from "@tanstack/react-query";
import {CalendarCheck,Copy,ExternalLink,MapPin,Scissors,Users} from "lucide-react";
import Link from "next/link";
import {api} from "@/shared/api/client";
import {useTenant} from "@/shared/components/providers";
import {Badge,Card,Empty} from "@/shared/components/ui";
import {dateTime} from "@/shared/lib/utils";
import type {Booking,Location,Resource,Service} from "@/shared/types/domain";

export function Dashboard(){
 const {tenantId,session}=useTenant();
 const bookings=useQuery({queryKey:["bookings",tenantId],queryFn:()=>api<Booking[]>("/api/v1/bookings"),enabled:!!tenantId});
 const locations=useQuery({queryKey:["locations",tenantId],queryFn:()=>api<Location[]>("/api/v1/locations"),enabled:!!tenantId});
 const services=useQuery({queryKey:["services",tenantId],queryFn:()=>api<Service[]>("/api/v1/services"),enabled:!!tenantId});
 const resources=useQuery({queryKey:["resources",tenantId],queryFn:()=>api<Resource[]>("/api/v1/resources"),enabled:!!tenantId});
 if(!tenantId||!session?.tenant)return <Empty title="Inicia sesión" description="Necesitamos conocer tu empresa."/>;
 const stats=[["Reservas",bookings.data?.length??0,CalendarCheck],["Sedes",locations.data?.length??0,MapPin],["Servicios",services.data?.length??0,Scissors],["Recursos",resources.data?.length??0,Users]] as const;
 const relative=`/${session.tenant.slug}`;
 const copy=()=>navigator.clipboard.writeText(`${window.location.origin}${relative}`).then(()=>import("sonner").then(({toast})=>toast.success("Enlace copiado")));
 return <><Card className="mb-6 border-teal-200 bg-teal-950 text-white"><p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Tu página está lista</p><h2 className="mt-2 text-2xl font-semibold">Comparte tu enlace de reservas</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><code className="min-w-0 flex-1 truncate rounded-xl bg-white/10 px-4 py-3 text-sm">{typeof window!=="undefined"?window.location.origin:""}{relative}</code><button onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-950"><Copy size={17}/>Copiar</button><Link target="_blank" href={relative} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-bold"><ExternalLink size={17}/>Abrir</Link></div></Card><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label,value,Icon])=><Card key={label}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={20}/></span><span className="text-3xl font-extrabold text-teal-950">{value}</span></div><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p></Card>)}</div><Card className="mt-6"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Próximas reservas</h2><p className="text-sm text-slate-500">Actividad reciente del negocio.</p></div><Link href="/admin/bookings" className="text-sm font-bold text-teal-700">Ver todas</Link></div><div className="mt-5 divide-y divide-slate-100">{bookings.data?.slice(0,6).map(booking=><div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{dateTime(booking.startAt)}</p><p className="text-xs text-slate-500">{booking.source} · {booking.id.slice(0,8)}</p></div><Badge tone={booking.status==="CONFIRMED"?"green":booking.status==="PENDING"?"amber":booking.status==="CANCELLED"?"red":"slate"}>{booking.status}</Badge></div>)}</div></Card></>;
}
