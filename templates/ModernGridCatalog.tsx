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
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="relative mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_340px] lg:items-end">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em]">Catalogo oficial</span>
            <h1 className="max-w-4xl text-2xl font-black leading-tight sm:text-4xl md:text-5xl">{business.name}</h1>
            <p className="max-w-2xl text-sm sm:text-base text-white/85">{business.description}</p>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {business.businessType && <span className="rounded-full bg-white/10 px-3 py-1.5">{business.businessType}</span>}
              {business.address && <span className="rounded-full bg-white/10 px-3 py-1.5">{business.address}</span>}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] opacity-80">Encuentra rapido</p>
            <CatalogControls categories={categories} searchState={searchState} compact />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-3 py-6 sm:px-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {featuredProducts.length > 0 && (
            <div>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--catalog-accent)]">Destacados</p>
                  <h2 className="text-xl font-black sm:text-2xl">Productos recomendados</h2>
                </div>
              </div>
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {featuredProducts.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--catalog-text-muted)]">Catalogo</p>
              <h2 className="text-xl font-black sm:text-2xl">Todos los productos</h2>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
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
