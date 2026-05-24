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
      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--catalog-accent)]">{business.businessType ?? "Boutique"}</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-7xl">{business.name}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">{business.description}</p>
        </div>
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-[4/3] w-full rounded-[var(--catalog-radius)] object-cover shadow-sm" />
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <CatalogControls categories={categories} searchState={searchState} compact />
        </div>
      </section>

      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-12">
          {featuredProducts.length > 0 && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--catalog-accent)]">Seleccion premium</p>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="premium" />
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-4xl font-semibold">Coleccion</h2>
              <span className="text-sm font-semibold text-gray-500">{products.length} productos</span>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="premium" />
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
