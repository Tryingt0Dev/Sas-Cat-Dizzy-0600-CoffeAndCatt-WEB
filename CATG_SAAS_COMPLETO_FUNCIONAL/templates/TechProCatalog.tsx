import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function TechProCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;

  return (
    <main className="min-h-screen bg-[var(--catalog-bg)]" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />

      <section className="bg-[var(--catalog-surface)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_460px] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[var(--catalog-accent)]">Asesoría técnica</p>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">{business.name}</h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--catalog-text-muted)]">{business.description}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4 shadow-sm">
                <p className="text-xs font-black uppercase text-[var(--catalog-text-muted)]">Categorías</p>
                <p className="mt-1 text-2xl font-black">{categories.length}</p>
              </div>
              <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4 shadow-sm">
                <p className="text-xs font-black uppercase text-[var(--catalog-text-muted)]">Productos</p>
                <p className="mt-1 text-2xl font-black">{products.length}</p>
              </div>
              <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4 shadow-sm">
                <p className="text-xs font-black uppercase text-[var(--catalog-text-muted)]">Canal</p>
                <p className="mt-1 text-2xl font-black">IA + WhatsApp</p>
              </div>
            </div>
          </div>
          <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-[4/3] w-full rounded-[var(--catalog-radius)] object-cover shadow-2xl" />
        </div>
      </section>

      <section className="border-y border-[var(--catalog-border)] bg-[var(--catalog-primary)] text-[var(--catalog-button-text)]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <CatalogControls categories={categories} searchState={searchState} compact />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          {featuredProducts.length > 0 && (
            <div className="mb-8 rounded-[var(--catalog-radius)] bg-[var(--catalog-surface)] p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Recomendados</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="tech" />
                ))}
              </div>
            </div>
          )}
          {products.length === 0 ? (
            <EmptyCatalogState />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} business={business} product={product} variant="tech" />
              ))}
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
