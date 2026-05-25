import { clsx } from "clsx";

export function FormSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4", className)}>
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">{title}</h3>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
