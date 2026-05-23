import { clsx } from "clsx";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">{eyebrow}</p>
        <h1 className="mt-2 text-balance text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
