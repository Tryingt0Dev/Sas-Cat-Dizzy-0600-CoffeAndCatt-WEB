import { clsx } from "clsx";

export function InfoCard({
  title,
  description,
  children,
  actions,
  className
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-3xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{title}</p>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
