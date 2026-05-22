import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function ModernGridCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;

  return (
    <main className="min-h-screen" style={themeStyle}>
      <section className="relative overflow-hidden bg-[var(--catalog-primary)] text-white">
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/75">Catalogo oficial</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight md:text-6xl">{business.name}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/85">{business.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
              {business.businessType && <span className="rounded-full bg-white/15 px-4 py-2">{business.businessType}</span>}
              {business.address && <span className="rounded-full bg-white/15 px-4 py-2">{business.address}</span>}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] bg-white/95 p-4 text-[var(--catalog-text)] shadow-xl">
            <CatalogControls categories={categories} searchState={searchState} compact />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_390px]">
        <div className="space-y-10">
          {featuredProducts.length > 0 && (
            <div>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Destacados</p>
                  <h2 className="text-3xl font-black">Productos recomendados</h2>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredProducts.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Catalogo</p>
              <h2 className="text-3xl font-black">Todos los productos</h2>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} business={business} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StoreChat businessSlug={business.slug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
