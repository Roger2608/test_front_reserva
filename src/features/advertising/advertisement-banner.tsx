"use client";

import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {ArrowUpRight,Megaphone,X} from "lucide-react";
import {api} from "@/shared/api/client";
import {useTenant} from "@/shared/components/providers";
import type {Advertisement} from "@/shared/types/domain";

export function AdvertisementBanner({advertisement,compact=false,onClose}:{advertisement:Advertisement;compact?:boolean;onClose?:()=>void}){
 return <aside aria-label={`Publicidad de ${advertisement.advertiserName}`} className={`relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-teal-50 shadow-sm ${compact?"p-3":"p-4 sm:p-5"}`}>
  <div className={`grid items-center gap-4 ${advertisement.imageUrl?"sm:grid-cols-[128px_1fr_auto]":"sm:grid-cols-[1fr_auto]"}`}>
   {advertisement.imageUrl&&<div role="img" aria-label={`Imagen de ${advertisement.advertiserName}`} className="aspect-[16/9] min-h-20 rounded-xl bg-slate-200 bg-cover bg-center" style={{backgroundImage:`url(${advertisement.imageUrl})`}}/>}
   <div><p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-amber-700"><Megaphone size={13}/>Publicidad</p><h2 className={`${compact?"mt-1 text-base":"mt-2 text-xl"} font-semibold text-teal-950`}>{advertisement.title}</h2><p className="mt-1 text-sm leading-5 text-slate-600">{advertisement.description}</p><p className="mt-1 text-xs font-semibold text-slate-400">Por {advertisement.advertiserName}</p></div>
   <a href={advertisement.destinationUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 text-sm font-bold text-white transition hover:bg-teal-900">{advertisement.ctaLabel}<ArrowUpRight size={16}/></a>
  </div>{onClose&&<button onClick={onClose} aria-label="Cerrar publicidad" className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm"><X size={15}/></button>}
 </aside>;
}

export function CustomerBookingAdvertisement({slug,enabled,reserve}:{slug:string;enabled:boolean;reserve:boolean}){
 const ad=useQuery({queryKey:["advertisement","customer",slug],queryFn:async()=>(await api<Advertisement|undefined>(`/public/v1/advertisements/slot/${slug}?placement=CUSTOMER_BOOKING`))??null,enabled,retry:false});
 if(reserve||(enabled&&ad.isLoading))return <div className="mt-6 min-h-40 animate-pulse rounded-2xl border border-slate-200 bg-white/70" aria-label="Cargando espacio publicitario"/>;
 return <div className="mt-6 min-h-0" aria-live="polite">{ad.data&&<AdvertisementBanner advertisement={ad.data}/>}</div>;
}

export function AdminTopAdvertisement(){
 const {session,tenantId}=useTenant();const eligible=session?.plan==="FREE"||session?.plan==="BASIC";const ad=useQuery({queryKey:["advertisement","admin",tenantId],queryFn:async()=>(await api<Advertisement|undefined>("/api/v1/advertisements/admin-slot"))??null,enabled:eligible&&!!tenantId,retry:false});
 if(!ad.data)return null;return <TimedAdminAdvertisement key={`${tenantId}-${ad.data.id}`} advertisement={ad.data}/>;
}

function TimedAdminAdvertisement({advertisement}:{advertisement:Advertisement}){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{if(!visible)return;const timer=window.setTimeout(()=>setVisible(false),advertisement.adminDisplaySeconds*1000);return()=>window.clearTimeout(timer)},[advertisement.adminDisplaySeconds,visible]);
 if(!visible)return null;return <div className="mb-5"><AdvertisementBanner compact advertisement={advertisement} onClose={()=>setVisible(false)}/></div>;
}
