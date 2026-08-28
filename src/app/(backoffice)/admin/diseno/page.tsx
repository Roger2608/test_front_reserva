import { DesignEditor } from "@/features/branding/design-editor";
export default function Page() {
  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Página pública
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-teal-950">Diseño</h1>
      </div>
      <DesignEditor />
    </>
  );
}
