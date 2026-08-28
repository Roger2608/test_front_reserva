import { TenantManager } from "@/features/tenants/tenant-manager";
export const metadata = { title: "Empresa" };
export default function TenantPage() {
  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Configuración
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-teal-950">
          Empresa activa
        </h1>
      </div>
      <TenantManager />
    </>
  );
}
