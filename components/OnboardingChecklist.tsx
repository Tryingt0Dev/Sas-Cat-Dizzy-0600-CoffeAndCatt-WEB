import Link from "next/link";

type OnboardingItem = {
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export function OnboardingChecklist({ items }: { items: OnboardingItem[] }) {
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Activacion comercial</p>
          <h2 className="mt-2 text-xl font-black">Deja tu tienda lista para vender</h2>
          <p className="mt-1 text-sm text-gray-500">Completa estos pasos para publicar una experiencia mas confiable.</p>
        </div>
        <div className="rounded-2xl bg-gray-900 px-4 py-3 text-right text-white">
          <p className="text-xs font-bold text-white/70">Progreso</p>
          <p className="text-2xl font-black">{progress}%</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:bg-white hover:shadow-sm">
            <div className="flex items-start gap-3">
              <span className={item.done ? "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white" : "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-gray-400"}>
                {item.done ? "OK" : ""}
              </span>
              <div>
                <p className="font-black text-gray-900">{item.label}</p>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
