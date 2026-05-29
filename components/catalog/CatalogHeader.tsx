import Link from "next/link";
import { buildWhatsappHref, defaultProductImage, type CatalogBusiness } from "@/lib/catalog";
import { SafeImage } from "./SafeImage";

export function CatalogHeader({
  business,
  productCount,
  categoryCount
}: {
  business: CatalogBusiness;
  productCount?: number;
  categoryCount?: number;
}) {
  const whatsappHref = buildWhatsappHref(business);
  const initials = business.name.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--catalog-border)] bg-[var(--catalog-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <Link href={`/store/${business.publicSlug}`} className="flex min-w-0 items-center gap-2.5">
          {business.logoUrl ? (
            <SafeImage src={business.logoUrl} fallback={defaultProductImage} alt={`${business.name} logo`} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--catalog-primary)] text-xs font-black text-[var(--catalog-button-text)]">
              {initials}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-[var(--catalog-text)]">{business.name}</span>
            {business.welcomeMessage ? (
              <span className="block truncate text-[0.65rem] text-[var(--catalog-text-muted)]">{business.welcomeMessage}</span>
            ) : (
              <span className="block truncate text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[var(--catalog-text-muted)]">
                {business.businessType || business.address || "Catalogo oficial"}
              </span>
            )}
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          {typeof productCount === "number" && (
            <span className="rounded-full bg-[var(--catalog-secondary)] px-2 py-1 text-[0.65rem] font-black text-[var(--catalog-text)]">
              {productCount} prod.
            </span>
          )}
          {typeof categoryCount === "number" && (
            <span className="rounded-full border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-2 py-1 text-[0.65rem] font-black text-[var(--catalog-text)]">
              {categoryCount} cat.
            </span>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--catalog-radius)] bg-emerald-600 px-2.5 py-1 text-[0.7rem] font-black text-white transition hover:bg-emerald-700"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
