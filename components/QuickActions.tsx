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
    <div className={`grid gap-2 ${gridClass}`}>
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          target={action.external ? "_blank" : undefined}
          className={`flex items-center gap-2 rounded-xl border transition duration-200 ${
            action.variant === "primary"
              ? "border-[var(--app-primary)] bg-[var(--app-primary)] text-[var(--app-button-text)] hover:opacity-90"
              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:border-[var(--app-primary)] hover:shadow-sm"
          } ${compact ? "px-2.5 py-2" : "p-3"}`}
        >
          {action.icon && (
            <span className={`flex shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-black ${
              action.variant === "primary"
                ? "bg-white/20"
                : "bg-[var(--app-surface-muted)]"
            } ${compact ? "h-6 w-6" : "h-7 w-7"}`}>
              {action.icon}
            </span>
          )}
          <span>
            <p className={`font-black leading-tight ${compact ? "text-xs" : "text-sm"}`}>{action.label}</p>
            {action.description && !compact && (
              <p className="text-xs leading-4 text-[var(--app-text-muted)] mt-0.5">{action.description}</p>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
