export default function Loading() {
  return (
    <div className="shell grid min-h-screen place-items-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-teal-700 border-t-transparent"
        aria-label="Cargando"
      />
    </div>
  );
}
