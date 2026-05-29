import type { CSSProperties } from "react";
import { CatalogTemplate } from "@/lib/enums";
import { getCatalogPaletteBySlug, getCatalogPaletteCssVariables, defaultCatalogPaletteSlug } from "@/lib/themes/theme-utils";

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  tags: string | null;
  featured: boolean;
  productViewCount: number;
  whatsappClickCount: number;
  createdAt: Date;
  category: CatalogCategory | null;
  attributesJson?: string | null;
  attributes?: Record<string, string | number | boolean | null> | null;
};

export type ProductAiContext = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  finalPrice: number;
  formattedFinalPrice: string;
  stock: number;
};

export type StoreChatAskDetail = {
  message: string;
  productId?: string;
  productContext?: ProductAiContext;
  autoSend: boolean;
};

export type CatalogBusiness = {
  id: string;
  name: string;
  slug: string;
  publicSlug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsappNumber: string | null;
  businessType: string | null;
  address: string | null;
  welcomeMessage?: string | null;
  catalogTemplate: string;
  catalogPalette?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonRadius: number;
};

export type CatalogSearchState = {
  q: string;
  category: string;
  sort: string;
};

export type CatalogThemeStyle = CSSProperties & {
  "--catalog-primary": string;
  "--catalog-secondary": string;
  "--catalog-accent": string;
  "--catalog-bg": string;
  "--catalog-text": string;
  "--catalog-radius": string;
};

export type CatalogTemplateProps = {
  business: CatalogBusiness;
  categories: CatalogCategory[];
  products: CatalogProduct[];
  featuredProducts: CatalogProduct[];
  searchState: CatalogSearchState;
  themeStyle: CatalogThemeStyle;
};

export const catalogTemplateOptions = [
  {
    value: CatalogTemplate.MODERN_GRID,
    label: "Modern Grid",
    description: "Cards modernas para productos generales, ropa, accesorios y belleza."
  },
  {
    value: CatalogTemplate.BOUTIQUE_PREMIUM,
    label: "Boutique Premium",
    description: "Visual mas editorial, elegante y espacioso para tiendas premium."
  },
  {
    value: CatalogTemplate.FAST_SALES,
    label: "Fast Sales",
    description: "Directo a conversion: precio, descuento, stock y WhatsApp visibles."
  },
  {
    value: CatalogTemplate.TECH_PRO,
    label: "Tech Pro",
    description: "Orden tecnico con especificaciones, confianza y asesoria."
  }
] as const;

export const defaultProductImage =
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop";

export function getCatalogThemeStyle(business: CatalogBusiness): CatalogThemeStyle {
  const palette = getCatalogPaletteBySlug(business.catalogPalette ?? defaultCatalogPaletteSlug);
  return {
    ...(getCatalogPaletteCssVariables(palette, business.buttonRadius) as unknown as CatalogThemeStyle),
    backgroundColor: palette.colors.background,
    color: palette.colors.text
  };
}

export function buildProductAiQuestion(product: ProductAiContext) {
  const sku = product.sku?.trim() || "N/D";
  return `Quiero información sobre este producto: ${product.name}, SKU ${sku}, precio ${product.formattedFinalPrice}, stock ${product.stock}.`;
}

export function buildWhatsappHref(business: CatalogBusiness, product?: CatalogProduct) {
  if (!business.whatsappNumber) return null;
  const digits = business.whatsappNumber.replace(/[^\d]/g, "");
  const cleanNumber = digits.startsWith("00")
    ? digits.slice(2)
    : digits.startsWith("56")
      ? digits
      : digits.length === 10 && digits.startsWith("09")
        ? `56${digits.slice(1)}`
        : digits.length === 9 && digits.startsWith("9")
          ? `56${digits}`
          : digits;
  if (cleanNumber.length < 8) return null;
  const message = product
    ? `Hola, quiero consultar por ${product.name} de ${business.name}.`
    : `Hola, quiero consultar por el catalogo de ${business.name}.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
