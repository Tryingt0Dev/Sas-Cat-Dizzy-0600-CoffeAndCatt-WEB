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

// Placeholder local SVG para productos sin imagen. No depende de internet externo.
const placeholderSvg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">',
  '<rect width="400" height="300" fill="#F1F5F9"/>',
  '<g transform="translate(150,100)">',
  '<rect x="0" y="0" width="100" height="75" rx="8" fill="#CBD5E1"/>',
  '<circle cx="80" cy="20" r="12" fill="#94A3B8"/>',
  '<polygon points="100,75 80,55 95,40 105,50 115,35 120,55 100,75" fill="#94A3B8"/>',
  '</g>',
  '<text x="200" y="210" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="14" font-weight="600" fill="#94A3B8">Sin imagen</text>',
  '</svg>'
].join("");
const base64Placeholder = btoa(placeholderSvg);
export const defaultProductImage = `data:image/svg+xml;base64,${base64Placeholder}`;

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
