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

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-6 py-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--catalog-accent)]">{business.businessType ?? "Boutique"}</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">{business.name}</h1>
          <p className="max-w-xl text-base leading-7 text-[var(--catalog-text-muted)]">{business.description}</p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-[var(--catalog-secondary)] px-4 py-2 text-sm font-black text-[var(--catalog-text)]">Tienda elegante</span>
            <span className="rounded-full bg-[var(--catalog-accent)] px-4 py-2 text-sm font-black text-[var(--catalog-accent-text)]">Compra premium</span>
          </div>
        </div>
        <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-[4/3] w-full rounded-[var(--catalog-radius)] object-cover shadow-2xl" />
      </section>

      <section className="border-y border-[var(--catalog-border)] bg-[var(--catalog-surface)]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <CatalogControls categories={categories} searchState={searchState} compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {featuredProducts.length > 0 && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--catalog-accent)]">Selección premium</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="premium" />
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-semibold">Colección</h2>
                <p className="text-sm text-[var(--catalog-text-muted)]">Elegancia enfocada para tu catálogo.</p>
              </div>
              <span className="text-sm font-semibold text-[var(--catalog-text-muted)]">{products.length} productos</span>
            </div>
            {products.length === 0 ? (
              <EmptyCatalogState />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
