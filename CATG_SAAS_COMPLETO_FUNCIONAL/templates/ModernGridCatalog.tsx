import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function ModernGridCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;

  return (
    <main className="min-h-screen" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />

      <section className="relative overflow-hidden bg-[var(--catalog-primary)] text-[var(--catalog-button-text)]">
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[1fr_360px] lg:items-end">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-[var(--catalog-surface)]/15 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.25em] text-[var(--catalog-button-text)]">Catálogo oficial</span>
            <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-5xl">{business.name}</h1>
            <p className="max-w-2xl text-base text-[var(--catalog-button-text)]">{business.description}</p>
            <div className="flex flex-wrap gap-3 text-sm font-black">
              {business.businessType && <span className="rounded-full bg-[var(--catalog-surface)]/15 px-4 py-2">{business.businessType}</span>}
              {business.address && <span className="rounded-full bg-[var(--catalog-surface)]/15 px-4 py-2">{business.address}</span>}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)]/10 p-5 shadow-2xl backdrop-blur">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--catalog-button-text)]">Encuentra rápido</p>
            <CatalogControls categories={categories} searchState={searchState} compact />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {featuredProducts.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Destacados</p>
                  <h2 className="text-3xl font-black">Productos recomendados</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {featuredProducts.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-text-muted)]">Catálogo</p>
              <h2 className="text-3xl font-black">Todos los productos</h2>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
