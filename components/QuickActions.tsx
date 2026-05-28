import Link from "next/link";

export type QuickAction = {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
  variant?: "primary" | "secondary";
};

export function QuickActions({ 
  actions,
  columns = 4,
  compact = false
}: { 
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  compact?: boolean;
}) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4"
  }[columns];

  return (
    <div className={`grid gap-3 ${gridClass}`}>
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          target={action.external ? "_blank" : undefined}
          className={`rounded-2xl border transition duration-200 ${
            action.variant === "primary"
              ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-button-text)] hover:opacity-90"
              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:border-[var(--app-primary)] hover:shadow-sm"
          } ${compact ? "p-2" : "p-3"}`}
        >
          {action.icon && <div className={`mb-1 ${compact ? "text-lg" : "text-xl"}`}>{action.icon}</div>}
          <p className={`font-black ${compact ? "text-xs" : "text-sm"}`}>{action.label}</p>
          {action.description && !compact && (
            <p className="text-xs leading-4 text-[var(--app-text-muted)] mt-1">{action.description}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
