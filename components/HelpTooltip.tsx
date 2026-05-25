import { clsx } from "clsx";

export function HelpTooltip({ description, className }: { description: string; className?: string }) {
  return (
    <span className={clsx("group relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={description}
        title={description}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-[11px] font-black text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        ?
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-[20rem] -translate-x-1/2 rounded-3xl border border-gray-200 bg-white px-4 py-3 text-left text-xs text-gray-700 shadow-lg opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 sm:w-72">
        {description}
      </span>
    </span>
  );
}
