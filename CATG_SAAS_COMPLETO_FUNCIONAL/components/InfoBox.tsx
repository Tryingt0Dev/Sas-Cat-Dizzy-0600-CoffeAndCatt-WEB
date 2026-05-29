import { clsx } from "clsx";

const variants = {
  info: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800"
} as const;

export function InfoBox({
  title,
  children,
  variant = "info",
  className
}: {
  title?: string;
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <div className={clsx("w-full rounded-2xl border p-4 text-sm leading-6", variants[variant], className)}>
      {title ? <p className="mb-1 font-black text-[var(--app-text)]">{title}</p> : null}
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
