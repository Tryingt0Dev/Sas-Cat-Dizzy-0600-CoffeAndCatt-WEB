import { clsx } from "clsx";

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm text-[var(--app-text)]", className)} {...props}>
      {children}
    </div>
  );
}
