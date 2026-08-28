import { AdvertisementEditor } from "@/features/advertising/advertisement-editor";
export default function Page() {
  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Promoción
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-teal-950">
          Mis anuncios
        </h1>
        <p className="mt-2 text-slate-600">
          Crea una campaña atractiva para llegar a nuevos clientes dentro de
          turno.
        </p>
      </div>
      <AdvertisementEditor />
    </>
  );
}
