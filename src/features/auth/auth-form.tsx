"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation} from "@tanstack/react-query";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {toast} from "sonner";
import {z} from "zod";
import {api} from "@/shared/api/client";
import {useTenant} from "@/shared/components/providers";
import {Button,Card,Field,Input,Select} from "@/shared/components/ui";
import type {Plan,Session} from "@/shared/types/domain";
const loginSchema=z.object({email:z.email("Correo inválido"),password:z.string().min(8,"Mínimo 8 caracteres")});
const registerSchema=loginSchema.extend({fullName:z.string().min(2),companyName:z.string().min(2),slug:z.string().min(2).regex(/^[a-z0-9-]+$/),plan:z.enum(["FREE","BASIC","PLUS","PREMIUM"])});
type Login=z.infer<typeof loginSchema>;type Register=z.infer<typeof registerSchema>;
const planLabel:Record<Plan,string>={FREE:"FREE · sin pago",BASIC:"BASIC · S/ 39",PLUS:"PLUS · S/ 79",PREMIUM:"PREMIUM · S/ 149"};
export function AuthForm({mode}:{mode:"login"|"register"}){
 const router=useRouter();const {setAuth}=useTenant();const schema=mode==="login"?loginSchema:registerSchema;
 const form=useForm<Login|Register>({resolver:zodResolver(schema),defaultValues:mode==="login"?{email:"",password:""}:{email:"",password:"",fullName:"",companyName:"",slug:"",plan:"FREE"}});
 const mutation=useMutation({mutationFn:(values:Login|Register)=>api<Session>(`/api/v1/auth/${mode}`,{method:"POST",body:JSON.stringify(mode==="register"?{...values,timezone:"America/Lima",currency:"PEN"}:values),noRefresh:true}),onSuccess:(session)=>{setAuth(session);toast.success(mode==="login"?"Bienvenido de nuevo":session.role==="PENDING_COMPANY"?"Continúa con el pago":"Tu empresa ya tiene una página pública");router.push(session.role==="PLATFORM_ADMIN"?"/plataforma":session.role==="PENDING_COMPANY"?"/pago/pendiente":"/admin")},onError:(error:Error)=>toast.error(error.message)});
 return <main className="grid min-h-screen place-items-center bg-[#f7f5ef] p-4"><Card className="w-full max-w-lg p-7"><Link href="/" className="text-xl font-extrabold text-teal-950">turno<span className="text-teal-600">.</span></Link><h1 className="mt-8 text-4xl font-semibold text-teal-950">{mode==="login"?"Ingresa a tu empresa":"Crea tu página de reservas"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{mode==="login"?"Administra horarios, reservas y diseño.":"Los planes pagados te llevarán a un checkout seguro."}</p><form className="mt-7 grid gap-4" onSubmit={form.handleSubmit(value=>mutation.mutate(value))}>{mode==="register"&&<><Field label="Tu nombre"><Input {...form.register("fullName" as keyof Register)}/></Field><Field label="Nombre de la empresa"><Input {...form.register("companyName" as keyof Register)}/></Field><Field label="Enlace público"><div className="flex items-center rounded-xl border border-slate-300 bg-white pl-3 text-sm text-slate-400"><span>/</span><Input className="border-0 focus:ring-0" placeholder="mi-negocio" {...form.register("slug" as keyof Register)}/></div></Field><Field label="Plan"><Select {...form.register("plan" as keyof Register)}>{(["FREE","BASIC","PLUS","PREMIUM"] as Plan[]).map(plan=><option value={plan} key={plan}>{planLabel[plan]}</option>)}</Select></Field></>}<Field label="Correo"><Input type="email" autoComplete="email" {...form.register("email")}/></Field><Field label="Contraseña"><Input type="password" autoComplete={mode==="login"?"current-password":"new-password"} {...form.register("password")}/></Field><Button disabled={mutation.isPending}>{mutation.isPending?"Procesando…":mode==="login"?"Ingresar":"Crear empresa"}</Button></form><p className="mt-6 text-center text-sm text-slate-500">{mode==="login"?<>¿Aún no tienes cuenta? <Link className="font-bold text-teal-700" href="/registro">Regístrate</Link></>:<>¿Ya tienes cuenta? <Link className="font-bold text-teal-700" href="/login">Ingresa</Link></>}</p></Card></main>;
}
