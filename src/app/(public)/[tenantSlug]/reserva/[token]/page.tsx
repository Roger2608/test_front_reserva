"use client";
import { useParams } from "next/navigation";
import { BookingResult } from "@/features/bookings/booking-result";
export default function Page(){const {tenantSlug,token}=useParams<{tenantSlug:string;token:string}>();return <BookingResult slug={tenantSlug} token={token}/>}
