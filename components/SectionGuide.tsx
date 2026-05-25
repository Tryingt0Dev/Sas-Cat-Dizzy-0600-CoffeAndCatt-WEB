import { clsx } from "clsx";

export function SectionGuide({
  eyebrow,
  title,
  description,
  help,
  actions,
  className
}: {
  eyebrow: string;
  title: string;
  description: string;
  help?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-3xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-gray-950">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
          {help ? <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">{help}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
