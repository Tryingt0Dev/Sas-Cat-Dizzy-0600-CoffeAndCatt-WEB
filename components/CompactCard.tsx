import { clsx } from "clsx";

/**
 * CompactCard - Variante más compacta del Card con padding reducido
 * Útil para listados y dashboards comprimidos
 */
export function CompactCard({ 
  children, 
  className,
  hover = false,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div 
      className={clsx(
        "rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-[var(--app-text)] shadow-sm",
        hover && "transition duration-200 hover:shadow-md hover:border-[var(--app-primary)]",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
