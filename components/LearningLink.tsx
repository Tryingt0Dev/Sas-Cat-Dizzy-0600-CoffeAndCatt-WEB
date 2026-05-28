import Link from "next/link";
import { clsx } from "clsx";

export function LearningLink({
  href,
  children,
  description,
  className
}: {
  href: string;
  children: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={clsx("inline-flex items-center gap-2 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]", className)}>
      {children}
      {description ? <span className="text-xs text-[var(--app-text-muted)]">{description}</span> : null}
    </Link>
  );
}
