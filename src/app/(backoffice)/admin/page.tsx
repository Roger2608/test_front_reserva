import { Dashboard } from "@/features/dashboard/dashboard";
export default function Page() {
  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Visión general
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-teal-950">
          Buenos días
        </h1>
        <p className="mt-2 text-slate-500">
          Todo lo importante de tu operación, en un solo lugar.
        </p>
      </div>
      <Dashboard />
    </>
  );
}
