"use client";
import { useParams } from "next/navigation";
import { PublicCatalog } from "@/features/catalog/public-catalog";
export default function Page(){const {tenantSlug}=useParams<{tenantSlug:string}>();return <PublicCatalog slug={tenantSlug}/>}
