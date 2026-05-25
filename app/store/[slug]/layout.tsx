import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCatalogPaletteBySlug, getCatalogPaletteCssVariables, defaultCatalogPaletteSlug } from "@/lib/themes/theme-utils";

type StoreLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;
  const business = await prisma.business.findFirst({
    where: { publicSlug: slug, isActive: true },
    select: { catalogPalette: true, buttonRadius: true }
  });

  if (!business) notFound();

  const palette = getCatalogPaletteBySlug(business.catalogPalette ?? defaultCatalogPaletteSlug);
  const themeStyle = getCatalogPaletteCssVariables(palette, business.buttonRadius);

  return (
    <div className="min-h-screen bg-[var(--catalog-bg)] text-[var(--catalog-text)]" style={themeStyle}>
      {children}
    </div>
  );
}
