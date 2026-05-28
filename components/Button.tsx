import { clsx } from "clsx";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  return (
    <button
      className={clsx(
        "rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--app-primary)] text-[var(--app-button-text,white)] hover:bg-[var(--app-primary-hover)]",
        variant === "secondary" && "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]",
        variant === "danger" && "bg-[var(--app-danger)] text-[var(--app-button-text)] hover:brightness-90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
