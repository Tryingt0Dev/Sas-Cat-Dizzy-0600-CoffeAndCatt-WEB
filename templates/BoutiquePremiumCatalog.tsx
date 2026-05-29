import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function BoutiquePremiumCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;

  return (
    <main className="min-h-screen bg-[var(--catalog-bg)]" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--catalog-accent)]">{business.businessType ?? "Boutique"}</p>
          <h1 className="max-w-3xl text-2xl font-semibold leading-tight sm:text-4xl md:text-5xl">{business.name}</h1>
          <p className="max-w-xl text-sm leading-7 text-[var(--catalog-text-muted)]">{business.description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--catalog-secondary)] px-3 py-1.5 text-xs font-black text-[var(--catalog-text)]">Tienda elegante</span>
            <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1.5 text-xs font-black text-[var(--catalog-accent-text)]">Compra premium</span>
          </div>
        </div>
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-[4/3] w-full rounded-[var(--catalog-radius)] object-cover shadow-2xl" />
      </section>

      <section className="border-y border-[var(--catalog-border)] bg-[var(--catalog-surface)]">
        <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-4">
          <CatalogControls categories={categories} searchState={searchState} compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-3 py-6 sm:px-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {featuredProducts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Seleccion premium</p>
              <div className="mt-3 grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="premium" />
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold sm:text-3xl">Coleccion</h2>
                <p className="text-xs text-[var(--catalog-text-muted)]">Elegancia enfocada para tu catalogo.</p>
              </div>
              <span className="text-xs font-semibold text-[var(--catalog-text-muted)]">{products.length} prod.</span>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="premium" />
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
