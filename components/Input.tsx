import { clsx } from "clsx";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-4 py-3 text-sm shadow-sm focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-4 py-3 text-sm shadow-sm focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-4 py-3 text-sm shadow-sm focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]",
        className
      )}
      {...props}
    />
  );
}
