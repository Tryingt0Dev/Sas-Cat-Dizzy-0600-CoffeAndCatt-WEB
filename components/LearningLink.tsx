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
    <Link href={href} className={clsx("inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50", className)}>
      {children}
      {description ? <span className="text-xs text-gray-500">{description}</span> : null}
    </Link>
  );
}
