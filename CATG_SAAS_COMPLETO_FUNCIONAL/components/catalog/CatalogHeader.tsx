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
    <header className="border-b border-[var(--catalog-border)] bg-[var(--catalog-surface)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href={`/store/${business.publicSlug}`} className="flex min-w-0 items-center gap-3">
          {business.logoUrl ? (
            <SafeImage src={business.logoUrl} fallback={defaultProductImage} alt={`${business.name} logo`} className="h-10 w-10 rounded-[var(--catalog-radius)] object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] text-sm font-black text-[var(--catalog-button-text)]">
              {initials}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-base font-black text-[var(--catalog-text)]">{business.name}</span>
            {business.welcomeMessage ? (
              <span className="block truncate text-xs text-[var(--catalog-text-muted)]">{business.welcomeMessage}</span>
            ) : (
              <span className="block truncate text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--catalog-text-muted)]">
                {business.businessType || business.address || "Catalogo oficial"}
              </span>
            )}
          </span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-sm font-black">
          {typeof productCount === "number" && (
            <span className="rounded-full bg-[var(--catalog-secondary)] px-2.5 py-1.5 text-[var(--catalog-text)]">
              {productCount} productos
            </span>
          )}
          {typeof categoryCount === "number" && (
            <span className="rounded-full border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-2.5 py-1.5 text-[var(--catalog-text)]">
              {categoryCount} categorias
            </span>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-3 py-1.5 text-sm text-[var(--catalog-button-text)]"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
