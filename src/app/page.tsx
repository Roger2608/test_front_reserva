import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Code2,
  ExternalLink,
  MessageCircle,
  Palette,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Scissors,
  Dumbbell,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      Icon: Clock3,
      title: "Disponibilidad real",
      text: "Tus clientes ven únicamente horarios que realmente pueden reservar.",
    },
    {
      Icon: MessageCircle,
      title: "Lista para WhatsApp",
      text: "Confirma citas y mantén a tus clientes informados automáticamente.",
    },
    {
      Icon: ShieldCheck,
      title: "Tu negocio, tus datos",
      text: "Tu información y configuración permanecen separadas y protegidas.",
    },
  ];
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7f6]">
      <header className="shell flex h-20 items-center justify-between">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-teal-950"
        >
          turno<span className="text-teal-600">.</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link
            href="/anuncios"
            className="hidden rounded-full px-4 py-2 hover:bg-white sm:inline-flex"
          >
            Descubrir negocios
          </Link>
          <Link href="/login" className="rounded-full px-4 py-2 hover:bg-white">
            Ingresar
          </Link>
          <Link
            href="/registro"
            className="rounded-full bg-slate-950 px-4 py-2 text-white transition hover:bg-teal-800"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>
      <section className="hero-showcase grid-paper relative border-y border-slate-900/5 py-14 md:py-28">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />
        <div className="shell relative grid items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <span className="inline-flex rounded-full border border-teal-800/15 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-teal-800">
              Tu negocio disponible 24/7
            </span>
            <h1 className="text-balance mt-7 text-5xl font-semibold leading-[1.02] text-teal-950 md:text-7xl">
              Una página de reservas que se siente realmente tuya.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Personaliza tu espacio, publica tus servicios y comparte un solo
              enlace. Tus clientes reservan sin llamadas, esperas ni cuentas.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-800"
              >
                Crear mi página <ArrowRight size={18} />
              </Link>
              <Link
                href="/anuncios"
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 font-bold text-slate-800 transition hover:border-teal-500 hover:text-teal-800"
              >
                Ver negocios
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              {[
                "Sin descargas",
                "Enlace propio",
                "Configurable en minutos",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={16} className="text-teal-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div
            className="booking-deck relative mx-auto h-[390px] w-[72%] max-w-[280px] sm:h-[525px] sm:w-full sm:max-w-md"
            aria-label="Ejemplos de páginas de reserva"
          >
            <BookingPreview
              icon={<Scissors size={19} />}
              initials="EN"
              name="Estudio Norte"
              category="Belleza"
              header="from-teal-950 via-teal-800 to-emerald-500"
              accent="border-teal-500 bg-teal-50"
              button="bg-slate-950"
              services={[
                ["Corte & estilo", "45 min"],
                ["Color personalizado", "90 min"],
                ["Sesión express", "30 min"],
              ]}
            />
            <BookingPreview
              icon={<HeartPulse size={19} />}
              initials="CS"
              name="Clínica Serena"
              category="Salud"
              header="from-sky-950 via-cyan-800 to-teal-400"
              accent="border-cyan-500 bg-cyan-50"
              button="bg-cyan-950"
              services={[
                ["Consulta general", "40 min"],
                ["Terapia física", "60 min"],
                ["Control preventivo", "30 min"],
              ]}
            />
            <BookingPreview
              icon={<Dumbbell size={19} />}
              initials="AM"
              name="Arena Movimiento"
              category="Bienestar"
              header="from-violet-950 via-indigo-800 to-fuchsia-500"
              accent="border-violet-500 bg-violet-50"
              button="bg-violet-950"
              services={[
                ["Entrenamiento personal", "60 min"],
                ["Evaluación inicial", "45 min"],
                ["Movilidad guiada", "30 min"],
              ]}
            />
            <div className="identity-chip absolute left-1/2 top-[340px] z-20 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur sm:top-[460px] sm:p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Tu identidad
              </p>
              <div className="mt-2 flex gap-2">
                <span
                  className="h-5 w-5 rounded-full bg-teal-700"
                  title="Belleza"
                />
                <span
                  className="h-5 w-5 rounded-full bg-cyan-500"
                  title="Salud"
                />
                <span
                  className="h-5 w-5 rounded-full bg-violet-500"
                  title="Bienestar"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="shell grid gap-5 py-16 md:grid-cols-3">
        {features.map(({ Icon, title, text }) => (
          <article
            key={title}
            className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-950/5"
          >
            <Icon className="text-teal-700" />
            <h2 className="mt-5 text-2xl font-semibold text-teal-950">
              {title}
            </h2>
            <p className="mt-2 leading-7 text-slate-600">{text}</p>
          </article>
        ))}
      </section>
      <section className="border-y border-slate-200/70 bg-white py-20">
        <div className="shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-teal-700">
              <Palette size={17} />
              Diseñado alrededor de tu marca
            </p>
            <h2 className="text-balance mt-4 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
              No compartas una agenda genérica. Comparte la experiencia de tu
              negocio.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Elige colores, portada, tipografía y estilo. Organiza tus sedes,
              servicios y profesionales para que cada cliente reconozca tu marca
              desde que abre el enlace.
            </p>
            <Link
              href="/registro"
              className="mt-7 inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-900"
            >
              Quiero crear la mía <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <BrandCard
              tone="bg-slate-950"
              accent="bg-teal-400"
              name="Estudio Forma"
              label="Sobrio"
            />
            <BrandCard
              tone="bg-teal-900"
              accent="bg-emerald-300"
              name="Clínica Serena"
              label="Profesional"
            />
            <BrandCard
              tone="bg-teal-950"
              accent="bg-emerald-400"
              name="Atelier Uno"
              label="Expresivo"
            />
            <BrandCard
              tone="bg-neutral-800"
              accent="bg-emerald-400"
              name="Norte Barber"
              label="Contemporáneo"
            />
          </div>
        </div>
      </section>
      <section className="shell pb-16 pt-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white shadow-2xl shadow-slate-950/15 md:px-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">
              <Sparkles size={16} />
              Una iniciativa de RICMTech
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              ¿Tu negocio necesita algo más que una agenda?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Turno es una iniciativa de{" "}
              <strong className="text-white">RICMTech</strong>. Diseñamos y
              construimos páginas web y soluciones digitales hechas para la
              operación y el crecimiento de cada negocio.
            </p>
            <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Code2 size={17} className="text-emerald-300" />
                Desarrollo a medida
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-300" />
                Tecnología lista para crecer
              </span>
            </div>
          </div>
          <a
            href="https://ricmtech.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 font-bold text-slate-950 transition hover:bg-emerald-50 lg:mt-0"
          >
            Construye tu web con nosotros <ExternalLink size={18} />
          </a>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white/60">
        <div className="shell flex flex-col gap-3 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong className="text-teal-950">turno.</strong> Reservas simples
            para negocios que crecen.
          </p>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} RICMTech. Todos los derechos
            reservados.
            <span className="mx-2 text-slate-300">·</span>
            Turno es una iniciativa de{" "}
            <a
              href="https://ricmtech.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-teal-700 hover:underline"
            >
              RICMTech
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

function BookingPreview({
  icon,
  initials,
  name,
  category,
  header,
  accent,
  button,
  services,
}: {
  icon: React.ReactNode;
  initials: string;
  name: string;
  category: string;
  header: string;
  accent: string;
  button: string;
  services: string[][];
}) {
  return (
    <article className="booking-deck-card absolute inset-x-0 top-0 rounded-[1.6rem] bg-slate-950 p-2 shadow-2xl shadow-slate-950/20 sm:rounded-[2rem] sm:p-2.5">
      <div className="overflow-hidden rounded-[1.2rem] bg-white sm:rounded-[1.55rem]">
        <div
          className={`h-24 bg-gradient-to-br p-3.5 text-white sm:h-32 sm:p-5 ${header}`}
        >
          <div className="flex items-center justify-between">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-[11px] font-bold backdrop-blur sm:h-10 sm:w-10 sm:text-sm">
              {initials}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] backdrop-blur sm:gap-1.5 sm:px-3 sm:text-xs">
              {icon}
              {category}
            </span>
          </div>
          <p className="mt-3 text-base font-semibold sm:mt-5 sm:text-xl">
            {name}
          </p>
        </div>
        <div className="p-3 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 sm:text-xs">
            Elige tu servicio
          </p>
          <div className="mt-2.5 space-y-1.5 sm:mt-4 sm:space-y-2">
            {services.map(([service, time], index) => (
              <div
                key={service}
                className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs sm:rounded-xl sm:p-3 sm:text-base ${index === 0 ? accent : "border-slate-200"}`}
              >
                <span className="font-semibold text-slate-900">{service}</span>
                <span className="text-[10px] text-slate-500 sm:text-xs">
                  {time}
                </span>
              </div>
            ))}
          </div>
          <div
            className={`mt-2.5 flex min-h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold text-white sm:mt-4 sm:min-h-11 sm:rounded-xl sm:text-sm ${button}`}
          >
            Reservar ahora <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </article>
  );
}

function BrandCard({
  tone,
  accent,
  name,
  label,
}: {
  tone: string;
  accent: string;
  name: string;
  label: string;
}) {
  return (
    <article
      className={`${tone} relative min-h-40 overflow-hidden rounded-2xl p-5 text-white`}
    >
      <span
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${accent} opacity-30 blur-2xl`}
      />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className={`h-8 w-8 rounded-full ${accent}`} />
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
            {label}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="mt-1 text-xs text-white/60">
            Reserva tu próxima visita
          </p>
        </div>
      </div>
    </article>
  );
}
