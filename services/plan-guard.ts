import { prisma } from "@/lib/db";
import { hasFullPlanAccess } from "@/lib/auth";
import { CatalogTemplate } from "@/lib/enums";
import { planDefinitions } from "@/lib/plans";

type PlanLimits = {
  type?: string;
  name?: string;
  maxTemplates: number;
  maxProducts?: number;
  maxImages?: number;
  maxCategories?: number;
  maxAiConversationsMonthly?: number;
  maxUsers?: number;
  maxMembers?: number;
  maxStores?: number;
  aiEnabled?: boolean;
  advancedBranding: boolean;
  advancedSeoEnabled?: boolean;
  analyticsEnabled?: boolean;
  pageBuilderEnabled?: boolean;
  advancedAttributesEnabled?: boolean;
  quotesAndOrders: boolean;
  customDomain?: boolean;
  supportLevel?: string;
};

type PlanIdentity = {
  email: string;
  role: string;
};

type BrandingSettings = {
  catalogTemplate: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonRadius: number;
  logoUrl: string | null;
  bannerUrl: string | null;
};

const TEMPLATE_ACCESS_ORDER = [
  CatalogTemplate.MODERN_GRID,
  CatalogTemplate.FAST_SALES,
  CatalogTemplate.BOUTIQUE_PREMIUM,
  CatalogTemplate.TECH_PRO
];

const DEFAULT_BRANDING = {
  primaryColor: "#111827",
  secondaryColor: "#F9FAFB",
  accentColor: "#E11D48",
  backgroundColor: "#F8FAFC",
  textColor: "#111827",
  buttonRadius: 18
};

export const platformFullAccessPlan: PlanLimits = {
  type: "PLATFORM_FULL_ACCESS",
  name: "Acceso total",
  maxProducts: 999999,
  maxImages: 999999,
  maxCategories: 999999,
  maxAiConversationsMonthly: 999999,
  maxUsers: 999999,
  maxMembers: 999999,
  maxStores: 999999,
  maxTemplates: TEMPLATE_ACCESS_ORDER.length,
  aiEnabled: true,
  advancedBranding: true,
  advancedSeoEnabled: true,
  analyticsEnabled: true,
  pageBuilderEnabled: true,
  advancedAttributesEnabled: true,
  quotesAndOrders: true,
  customDomain: true,
  supportLevel: "platform"
};

export class PlanAccessError extends Error {
  constructor(message = "Tu plan actual no incluye esta funcion") {
    super(message);
  }
}

function fallbackPlan(): PlanLimits {
  return planDefinitions.FREE;
}

export function effectivePlanLimits(plan: PlanLimits | null | undefined, user?: PlanIdentity | null) {
  if (hasFullPlanAccess(user)) return platformFullAccessPlan;
  return plan ?? fallbackPlan();
}

export function planDisplayName(plan: PlanLimits | null | undefined, user?: PlanIdentity | null) {
  return effectivePlanLimits(plan, user).name ?? fallbackPlan().name;
}

export function allowedTemplatesForPlan(plan: PlanLimits | null | undefined) {
  const maxTemplates = Math.max(1, plan?.maxTemplates ?? fallbackPlan().maxTemplates);
  return TEMPLATE_ACCESS_ORDER.slice(0, maxTemplates);
}

export function assertTemplateAllowed(plan: PlanLimits | null | undefined, template: string, currentTemplate?: string | null) {
  if (currentTemplate && template === currentTemplate) return;
  if (!allowedTemplatesForPlan(plan).includes(template as CatalogTemplate)) {
    throw new PlanAccessError("Tu plan actual no incluye esta plantilla de catalogo");
  }
}

function usesAdvancedBranding(settings: BrandingSettings) {
  return (
    Boolean(settings.logoUrl || settings.bannerUrl) ||
    settings.primaryColor !== DEFAULT_BRANDING.primaryColor ||
    settings.secondaryColor !== DEFAULT_BRANDING.secondaryColor ||
    settings.accentColor !== DEFAULT_BRANDING.accentColor ||
    settings.backgroundColor !== DEFAULT_BRANDING.backgroundColor ||
    settings.textColor !== DEFAULT_BRANDING.textColor ||
    settings.buttonRadius !== DEFAULT_BRANDING.buttonRadius
  );
}

function brandingChanged(current: BrandingSettings | null | undefined, next: BrandingSettings) {
  if (!current) return usesAdvancedBranding(next);
  return (
    current.logoUrl !== next.logoUrl ||
    current.bannerUrl !== next.bannerUrl ||
    current.primaryColor !== next.primaryColor ||
    current.secondaryColor !== next.secondaryColor ||
    current.accentColor !== next.accentColor ||
    current.backgroundColor !== next.backgroundColor ||
    current.textColor !== next.textColor ||
    current.buttonRadius !== next.buttonRadius
  );
}

export function assertAdvancedBrandingAllowed(
  plan: PlanLimits | null | undefined,
  settings: BrandingSettings,
  currentSettings?: BrandingSettings | null
) {
  if (plan?.advancedBranding ?? fallbackPlan().advancedBranding) return;
  if (brandingChanged(currentSettings, settings) && usesAdvancedBranding(settings)) {
    throw new PlanAccessError("Tu plan actual no incluye branding avanzado");
  }
}

export async function getPlanLimitsForBusiness(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { plan: true, owner: true }
  });

  return effectivePlanLimits(business?.plan, business?.owner);
}

export async function getStorePlan(businessId: string) {
  return getPlanLimitsForBusiness(businessId);
}

export type PlanFeature =
  | "ai"
  | "advancedBranding"
  | "advancedSeo"
  | "analytics"
  | "pageBuilder"
  | "advancedAttributes"
  | "quotesAndOrders"
  | "customDomain";

function featureEnabled(plan: PlanLimits, feature: PlanFeature) {
  if (feature === "ai") return plan.aiEnabled !== false;
  if (feature === "advancedBranding") return plan.advancedBranding;
  if (feature === "advancedSeo") return plan.advancedSeoEnabled === true;
  if (feature === "analytics") return plan.analyticsEnabled === true;
  if (feature === "pageBuilder") return plan.pageBuilderEnabled === true;
  if (feature === "advancedAttributes") return plan.advancedAttributesEnabled === true;
  if (feature === "quotesAndOrders") return plan.quotesAndOrders;
  if (feature === "customDomain") return plan.customDomain === true;
  return false;
}

export async function requireFeature(businessId: string, feature: PlanFeature) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (!featureEnabled(plan, feature)) {
    throw new PlanAccessError("Tu plan actual no incluye esta funcion");
  }
  return plan;
}

export type PlanLimitType = "products" | "categories" | "members" | "images" | "stores";

export async function assertWithinPlanLimit(businessId: string, limitType: PlanLimitType, currentCount?: number) {
  const plan = await getPlanLimitsForBusiness(businessId);
  const limit =
    limitType === "products"
      ? plan.maxProducts
      : limitType === "categories"
        ? plan.maxCategories
        : limitType === "members"
          ? plan.maxMembers ?? plan.maxUsers
          : limitType === "images"
            ? plan.maxImages
            : plan.maxStores;
  if (!limit || limit < 0) return plan;

  let count = currentCount;
  if (typeof count !== "number") {
    if (limitType === "products") count = await prisma.product.count({ where: { businessId } });
    if (limitType === "categories") count = await prisma.category.count({ where: { businessId } });
    if (limitType === "members") count = await prisma.membership.count({ where: { businessId } });
  }

  if ((count ?? 0) >= limit) {
    const label =
      limitType === "products"
        ? "productos"
        : limitType === "categories"
          ? "categorias"
          : limitType === "members"
            ? "miembros"
            : limitType === "images"
              ? "imagenes"
              : "tiendas";
    throw new PlanAccessError(`No puedes agregar mas ${label}: tu plan actual permite hasta ${limit}`);
  }
  return plan;
}

export async function canCreateProduct(businessId: string) {
  await assertWithinPlanLimit(businessId, "products");
  return true;
}

export async function canUploadImage(businessId: string, currentImageCount?: number) {
  await assertWithinPlanLimit(businessId, "images", currentImageCount);
  return true;
}

export async function canUseAI(businessId: string) {
  await requireFeature(businessId, "ai");
  return true;
}

export async function canInviteMember(businessId: string) {
  await assertWithinPlanLimit(businessId, "members");
  return true;
}

export async function assertQuotesAndOrdersAllowed(businessId: string) {
  await requireFeature(businessId, "quotesAndOrders");
}
