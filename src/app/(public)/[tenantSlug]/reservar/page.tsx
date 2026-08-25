"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { BookingWizard } from "@/features/bookings/booking-wizard";
export default function Page(){const {tenantSlug}=useParams<{tenantSlug:string}>();return <Suspense fallback={<div className="grid min-h-screen place-items-center">Preparando agenda…</div>}><BookingWizard slug={tenantSlug}/></Suspense>}
