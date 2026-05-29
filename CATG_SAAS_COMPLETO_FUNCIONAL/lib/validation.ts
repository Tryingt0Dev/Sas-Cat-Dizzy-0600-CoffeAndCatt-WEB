import { z } from "zod";
import {
  CatalogTemplate,
  ConversationStatus,
  CustomerStatus,
  enumValues,
  OrderStatus,
  ProductStatus,
  QuoteStatus
} from "@/lib/enums";
import { StoreType } from "@/lib/store-types";
import { slugify } from "@/lib/format";
import { isStrongPassword, passwordPolicyDescription } from "@/lib/password-policy";

export const requiredString = z.string().trim().min(1);
export const optionalText = z.string().trim().optional().transform((value) => value || null);
export const optionalUrl = z.string().trim().url().optional().or(z.literal("")).transform((value) => value || null);
export const optionalInstagramUrl = z
  .string()
  .trim()
  .max(160)
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) return null;
    const cleaned = value.trim().replace(/^@+/, "");
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    return `https://instagram.com/${cleaned}`;
  })
  .refine((value) => {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) && /(^|\.)instagram\.com$/i.test(parsed.hostname);
    } catch {
      return false;
    }
  }, "Instagram debe ser un usuario o enlace valido");
export const optionalImageUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    if (value.toLowerCase().split("?")[0].endsWith(".svg")) return false;
    if (value.startsWith("/uploads/")) return true;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, "URL de imagen invalida")
  .transform((value) => value || null);
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const reservedPublicSlugs = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "register",
  "pricing",
  "billing",
  "settings",
  "superadmin",
  "store",
  "app",
  "www",
  "mail",
  "support"
]);

export function normalizePublicSlug(value: string) {
  return slugify(value).slice(0, 80);
}

export const publicSlugSchema = z
  .string()
  .trim()
  .min(2, "Slug demasiado corto")
  .max(80, "Slug demasiado largo")
  .transform(normalizePublicSlug)
  .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), "Slug invalido")
  .refine((value) => !reservedPublicSlugs.has(value), "Slug reservado");

export function imageUrlBelongsToBusiness(url: string | null | undefined, businessId: string) {
  if (!url) return true;
  if (!url.startsWith("/uploads/")) return true;

  const parts = url.split("/").filter(Boolean);
  if (parts[0] !== "uploads") return false;

  const isCurrentStoragePath =
    parts.length >= 5 &&
    parts[1] === "businesses" &&
    parts[2] === businessId &&
    parts[3] === "images";
  const isLegacyStoragePath = parts.length >= 3 && parts[1] === businessId;
  if (!isCurrentStoragePath && !isLegacyStoragePath) return false;

  return !parts.some((part) => part === "." || part === ".." || part.includes("\0") || part.includes("\\"));
}

export function intFromForm(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  name: requiredString.max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(120),
  confirmPassword: z.string().min(1).max(120),
  businessName: requiredString.max(120),
  businessType: z.string().trim().max(80).optional().default("Tienda")
}).superRefine((value, ctx) => {
  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"]
    });
  }

  if (!isStrongPassword(value.password, value.email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: passwordPolicyDescription,
      path: ["password"]
    });
  }
});

export const productFormSchema = z.object({
  id: z.string().optional(),
  name: requiredString.max(160),
  sku: z.string().trim().max(80).optional().transform((value) => value || null),
  categoryId: z.string().trim().optional().transform((value) => value || null),
  description: optionalText,
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).optional().nullable(),
  costPrice: z.coerce.number().int().min(0).optional().nullable(),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  imageUrl: optionalImageUrl,
  tags: z.string().trim().max(300).optional().transform((value) => value || null),
  status: z.enum(enumValues(ProductStatus)).default(ProductStatus.ACTIVE),
  featured: z.boolean().default(false),
  productAttributes: z.record(z.string(), z.string().trim()).optional().nullable()
});

export const settingsFormSchema = z.object({
  name: requiredString.max(120),
  publicSlug: publicSlugSchema,
  dashboardTitle: z.string().trim().max(120).optional().transform((value) => value || null),
  dashboardSubtitle: z.string().trim().max(220).optional().transform((value) => value || null),
  description: optionalText,
  whatsappNumber: z.string().trim().max(40).optional().transform((value) => value || null),
  instagramUrl: optionalInstagramUrl,
  businessType: z.enum(enumValues(StoreType)).optional().transform((value) => value || null),
  address: z.string().trim().max(180).optional().transform((value) => value || null),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Moneda invalida").default("CLP"),
  catalogTemplate: z.enum(enumValues(CatalogTemplate)),
  primaryColor: colorSchema,
  secondaryColor: colorSchema,
  accentColor: colorSchema,
  backgroundColor: colorSchema,
  textColor: colorSchema,
  buttonRadius: z.coerce.number().int().min(0).max(32),
  logoUrl: optionalImageUrl,
  bannerUrl: optionalImageUrl,
  tone: requiredString.max(160),
  instructions: optionalText,
  fallbackMessage: requiredString.max(500),
  allowAutoLead: z.boolean().default(false),
  humanHandoffEnabled: z.boolean().default(false),
  welcomeMessage: z.string().trim().max(280).optional().transform((value) => value || null),
  seoTitle: z.string().trim().max(120).optional().transform((value) => value || null),
  seoDescription: z.string().trim().max(180).optional().transform((value) => value || null),
  seoKeywords: z.string().trim().max(240).optional().transform((value) => value || null),
  faq: z.string().trim().max(2000).optional().transform((value) => value || null),
  showFeaturedCategories: z.boolean().default(false),
  showFeaturedProducts: z.boolean().default(false)
});

export const aiProductContextSchema = z.object({
  id: z.string().trim().max(120),
  name: requiredString.max(160),
  sku: z.string().trim().max(80).nullable().optional().transform((value) => value || null),
  description: z.string().trim().max(800).nullable().optional().transform((value) => value || null),
  price: z.coerce.number().int().min(0),
  compareAtPrice: z.coerce.number().int().min(0).nullable().optional().transform((value) => value ?? null),
  discountPercent: z.coerce.number().int().min(0).max(100).default(0),
  finalPrice: z.coerce.number().int().min(0),
  formattedFinalPrice: z.string().trim().max(80).optional(),
  stock: z.coerce.number().int().min(0)
});

export const aiRequestSchema = z
  .object({
    businessSlug: z.string().trim().max(120).optional(),
    publicSlug: z.string().trim().max(120).optional(),
    customerMessage: z.string().trim().max(1200).optional(),
    message: z.string().trim().max(1200).optional(),
    customerPhone: z.string().trim().max(40).optional(),
    phone: z.string().trim().max(40).optional(),
    conversationId: z.string().trim().max(120).optional(),
    visitorId: z.string().trim().max(120).optional(),
    productId: z.string().trim().max(120).optional(),
    productContext: aiProductContextSchema.optional()
  })
  .transform((value, ctx) => {
    const businessSlug = value.businessSlug || value.publicSlug || "";
    const customerMessage = value.customerMessage || value.message || "";
    if (!businessSlug) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "businessSlug es obligatorio" });
    }
    if (!customerMessage) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "message es obligatorio" });
    }
    return {
      businessSlug,
      customerMessage,
      customerPhone: value.customerPhone || value.phone,
      conversationId: value.conversationId || undefined,
      visitorId: value.visitorId || undefined,
      productId: value.productId || value.productContext?.id || undefined,
      productContext: value.productContext
    };
  });

export const aiResponseSchema = z.object({
  reply: requiredString.max(1200),
  intent: z.enum(["general_question", "product_interest", "purchase_interest", "support", "unknown"]),
  lead_score: z.coerce.number().int().min(0).max(100).default(0),
  customer_status: z.enum(enumValues(CustomerStatus)),
  recommended_product_ids: z.array(z.string()).default([]),
  next_action: z.enum(["answer", "ask_more", "suggest_quote", "human_handoff"])
});

export type AiResponsePayload = z.infer<typeof aiResponseSchema>;

export const customerUpdateSchema = z.object({
  id: requiredString,
  name: z.string().trim().max(120).optional().transform((value) => value || null),
  phone: z.string().trim().max(40).optional().transform((value) => value || null),
  email: z.string().trim().email().optional().or(z.literal("")).transform((value) => value || null),
  status: z.enum(enumValues(CustomerStatus)),
  leadScore: z.coerce.number().int().min(0).max(100),
  notes: optionalText
});

export const quoteStatusSchema = z.enum(enumValues(QuoteStatus));
export const orderStatusSchema = z.enum(enumValues(OrderStatus));
export const conversationStatusSchema = z.enum(enumValues(ConversationStatus));
