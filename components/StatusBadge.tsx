import { clsx } from "clsx";

const variants = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  dark: "bg-gray-950 text-white"
} as const;

export function StatusBadge({
  children,
  variant = "neutral",
  className
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-black", variants[variant], className)}>
      {children}
    </span>
  );
}

