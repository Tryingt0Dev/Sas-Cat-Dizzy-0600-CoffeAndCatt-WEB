import { clsx } from "clsx";

export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-3xl border border-gray-200 bg-white p-6 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
