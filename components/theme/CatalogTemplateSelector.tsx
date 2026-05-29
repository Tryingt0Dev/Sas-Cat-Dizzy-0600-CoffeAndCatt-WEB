"use client";

import { catalogTemplateOptions } from "@/lib/catalog";

function TemplateMiniPreview({ template }: { template: string }) {
  const baseClasses = "rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3";

  if (template === "modern_grid") {
    return (
      <div className={baseClasses}>
        <div className="space-y-2">
          <div className="h-1.5 w-3/4 rounded-full bg-[var(--app-primary)]" />
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1 rounded-lg bg-white p-2 shadow-sm">
                <div className="h-6 rounded-md bg-[var(--app-surface-muted)]" />
                <div className="h-1 w-2/3 rounded-full bg-[var(--app-text-muted)]" />
                <div className="h-2 w-1/2 rounded-full bg-[var(--app-primary)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === "boutique_premium") {
    return (
      <div className={baseClasses}>
        <div className="space-y-2">
          <div className="h-8 w-full rounded-lg bg-gradient-to-r from-[var(--app-primary)] to-transparent opacity-20" />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="h-10 rounded-lg bg-[var(--app-primary)] opacity-20" />
              <div className="h-1.5 w-2/3 rounded-full bg-[var(--app-text)]" />
              <div className="h-1 w-1/2 rounded-full bg-[var(--app-text-muted)]" />
            </div>
            <div className="space-y-1">
              <div className="h-10 rounded-lg bg-[var(--app-primary)] opacity-20" />
              <div className="h-1.5 w-2/3 rounded-full bg-[var(--app-text)]" />
              <div className="h-1 w-1/2 rounded-full bg-[var(--app-text-muted)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "fast_sales") {
    return (
      <div className={baseClasses}>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <div className="h-1.5 w-16 rounded-full bg-[var(--app-text)]" />
          </div>
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm">
                <div className="space-y-1">
                  <div className="h-1.5 w-20 rounded-full bg-[var(--app-text)]" />
                  <div className="h-2 w-12 rounded-full bg-pink-600" />
                </div>
                <div className="h-6 w-12 rounded-md bg-emerald-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // tech_pro
  return (
    <div className={baseClasses}>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 w-10 rounded-full bg-[var(--app-primary)]" />
          ))}
        </div>
        <div className="rounded-lg bg-white p-2 shadow-sm">
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-md bg-[var(--app-surface-muted)]" />
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-3/4 rounded-full bg-[var(--app-text)]" />
              <div className="flex gap-1">
                <div className="h-1 w-10 rounded-full bg-[var(--app-primary)]" />
                <div className="h-1 w-8 rounded-full bg-[var(--app-text-muted)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogTemplateSelector({
  selectedTemplate,
  allowedTemplates,
  onTemplateChange
}: {
  selectedTemplate: string;
  allowedTemplates: string[];
  onTemplateChange?: (template: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {catalogTemplateOptions.map((option) => {
        const allowed = allowedTemplates.includes(option.value);
        const isSelected = option.value === selectedTemplate;
        return (
          <button
            key={option.value}
            type="button"
            disabled={!allowed}
            onClick={() => allowed && onTemplateChange?.(option.value)}
            className={
              "rounded-2xl border p-3 text-left transition duration-200 " +
              (isSelected
                ? "border-[var(--app-primary)] bg-[var(--app-surface)] shadow-sm ring-1 ring-[var(--app-primary)]"
                : allowed
                  ? "border-[var(--app-border)] bg-[var(--app-surface-muted)] hover:-translate-y-0.5 hover:bg-[var(--app-surface)] hover:shadow-sm"
                  : "border-[var(--app-border)] bg-[var(--app-surface-muted)] opacity-50 cursor-not-allowed")
            }
          >
            <TemplateMiniPreview template={option.value} />
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-[var(--app-text)]">{option.label}</p>
                {isSelected ? (
                  <span className="shrink-0 rounded-full bg-[var(--app-primary)] px-2 py-0.5 text-[0.6rem] font-black text-[var(--app-button-text)]">Activo</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[0.7rem] leading-4 text-[var(--app-text-muted)]">{option.description}</p>
              {!allowed ? (
                <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-bold text-amber-700">Plan superior</span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
