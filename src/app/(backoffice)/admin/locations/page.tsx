import { CatalogManager } from "@/features/catalog/catalog-manager";
export default function Page() {
  return (
    <>
      <Header eyebrow="Operación" title="Sedes" />
      <CatalogManager kind="locations" />
    </>
  );
}
function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-4xl font-semibold text-teal-950">{title}</h1>
    </div>
  );
}
