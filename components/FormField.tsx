import { clsx } from "clsx";

export function FieldHint({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={clsx("mt-1 max-w-prose text-xs leading-5 text-[var(--app-text-muted)]", className)}>
      {children}
    </p>
  );
}

export function FieldError({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={clsx("mt-1 max-w-prose text-xs font-bold leading-5 text-[var(--app-danger)]", className)}>
      {children}
    </p>
  );
}

export function FormField({
  label,
  hint,
  error,
  children,
  className
}: {
  label: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block min-w-0 text-sm font-semibold text-[var(--app-text)]", className)}>
      <span className="block">{label}</span>
      <FieldHint>{hint}</FieldHint>
      <div className="mt-2 min-w-0">{children}</div>
      <FieldError>{error}</FieldError>
    </label>
  );
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("grid min-w-0 gap-4 md:grid-cols-2", className)}>{children}</div>;
}
