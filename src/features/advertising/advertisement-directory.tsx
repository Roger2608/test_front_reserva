"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {Megaphone} from "lucide-react";
import {api} from "@/shared/api/client";
import {Card,Empty} from "@/shared/components/ui";
import type {Advertisement} from "@/shared/types/domain";
import {AdvertisementBanner} from "./advertisement-banner";

export function AdvertisementDirectory(){const campaigns=useQuery({queryKey:["advertisement-directory"],queryFn:()=>api<Advertisement[]>("/public/v1/advertisements/directory")});const [featured,setFeatured]=useState(0);useEffect(()=>{if(!campaigns.data||campaigns.data.length<2)return;const timer=window.setInterval(()=>setFeatured(value=>(value+1)%campaigns.data!.length),6000);return()=>window.clearInterval(timer)},[campaigns.data]);return <main className="min-h-screen bg-[#f7f5ef]"><header className="shell flex h-20 items-center justify-between"><Link href="/" className="text-xl font-extrabold text-teal-950">turno<span className="text-teal-600">.</span></Link><Link href="/registro" className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white">Publica con Premium</Link></header><section className="bg-teal-950 py-16 text-white"><div className="shell"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[.2em] text-amber-300"><Megaphone size={17}/>Vitrina de negocios</p><h1 className="mt-4 max-w-3xl text-5xl font-semibold">Descubre empresas que tienen algo valioso para ofrecerte</h1><p className="mt-4 max-w-2xl text-lg text-teal-100">Campañas activas de negocios Premium de nuestra comunidad, organizadas para conectar con nuevos clientes.</p></div></section><div className="shell py-12">{campaigns.isLoading?<Card>Cargando campañas…</Card>:!campaigns.data?.length?<Empty title="Próximamente habrá campañas" description="Los negocios Premium aparecerán aquí cuando publiquen sus anuncios."/>:<><section><p className="mb-3 text-sm font-bold uppercase tracking-widest text-teal-700">Negocio destacado</p><AdvertisementBanner advertisement={campaigns.data[featured%campaigns.data.length]!}/></section><section className="mt-12"><h2 className="text-3xl font-semibold text-teal-950">Todas las campañas</h2><div className="mt-6 grid gap-5 md:grid-cols-2">{campaigns.data.map(ad=><AdvertisementBanner key={ad.id} advertisement={ad}/>)}</div></section></>}</div></main>}
