import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { buildWhatsappHref, defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function FastSalesCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;
  const whatsappHref = buildWhatsappHref(business);

  return (
    <main className="min-h-screen bg-[var(--catalog-bg)]" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />
      <section className="border-b border-[var(--catalog-border)] bg-[var(--catalog-surface)]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div className="grid gap-4 md:grid-cols-[150px_1fr] md:items-center">
            <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-square w-full rounded-[var(--catalog-radius)] object-cover shadow-lg" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--catalog-accent)]">Compra rapida</p>
              <h1 className="mt-1 text-2xl font-black sm:text-4xl md:text-5xl">{business.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-[var(--catalog-text-muted)]">{business.description}</p>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" className="mt-4 inline-flex rounded-[var(--catalog-radius)] bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-lg transition hover:bg-emerald-700">
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--catalog-text)]">Filtros de compra</p>
            <div className="mt-3">
              <CatalogControls categories={categories} searchState={searchState} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-3 py-6 sm:px-5 lg:grid-cols-[1fr_300px]">
        <div>
          {featuredProducts.length > 0 && (
            <div className="mb-6 rounded-[var(--catalog-radius)] border border-[var(--catalog-accent)]/25 bg-[var(--catalog-surface)] p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--catalog-accent)]">Ofertas destacadas</p>
              <div className="mt-3 grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="fast" />
                ))}
              </div>
            </div>
          )}
          {products.length === 0 ? (
            <EmptyCatalogState />
          ) : (
            <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} business={business} product={product} variant="fast" />
              ))}
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
