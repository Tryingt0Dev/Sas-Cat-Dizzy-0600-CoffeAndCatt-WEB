import { clsx } from "clsx";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm", className)}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-2xl text-gray-500">
        {icon ?? <span>?</span>}
      </div>
      <h3 className="mt-5 text-xl font-black text-gray-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
