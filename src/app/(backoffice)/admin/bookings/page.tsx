import { BookingCreator, BookingList } from "@/features/bookings/booking-list";
export default function Page() {
  return (
    <>
      <div className="mb-7">
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          Operación diaria
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-teal-950">Reservas</h1>
        <p className="mt-2 text-slate-500">
          Crea, confirma, completa o cancela desde una sola vista. En Premium,
          los recordatorios se procesan diariamente a las 9:00 a. m. y también
          puedes enviarlos manualmente.
        </p>
      </div>
      <BookingCreator />
      <BookingList />
    </>
  );
}
