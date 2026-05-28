import { prisma } from "@/lib/db";
import { hasFullPlanAccess } from "@/lib/auth";
import { CatalogTemplate } from "@/lib/enums";
import {
  FEATURE_KEYS,
  canUseFeature as planCanUseFeature,
  getPlanEntitlements,
  getLimit,
  limitToNumber,
  normalizePlanSlug,
  planDefinitions,
  type FeatureKey,
  type PlanLimitKey
} from "@/lib/plans";
import { auditBlocked } from "@/services/audit-log";

type PlanLimits = {
  id?: string;
  type?: string;
  name?: string;
  description?: string;
  maxTemplates: number;
  maxProducts?: number;
  maxImages?: number;
  maxCategories?: number;
  maxAiConversationsMonthly?: number;
  aiRequestsPerMinute?: number;
  maxUsers?: number;
  maxMembers?: number;
  maxStores?: number;
  aiEnabled?: boolean;
  advancedBranding: boolean;
  customTheme?: "basic" | "advanced";
  auditLog?: boolean;
  advancedSettings?: boolean;
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
  description: "Acceso interno de plataforma para soporte y administracion.",
  maxProducts: 999999,
  maxImages: 999999,
  maxCategories: 999999,
  maxAiConversationsMonthly: 999999,
  aiRequestsPerMinute: 999999,
  maxUsers: 999999,
  maxMembers: 999999,
  maxStores: 999999,
  maxTemplates: TEMPLATE_ACCESS_ORDER.length,
  aiEnabled: true,
  advancedBranding: true,
  customTheme: "advanced",
  auditLog: true,
  advancedSettings: true,
  advancedSeoEnabled: true,
  analyticsEnabled: true,
  pageBuilderEnabled: true,
  advancedAttributesEnabled: true,
  quotesAndOrders: true,
  customDomain: true,
  supportLevel: "platform"
};

export class PlanAccessError extends Error {
  constructor(message = "Tu plan actual no permite esta accion.") {
    super(message);
  }
}

function fallbackPlan(): PlanLimits {
  return {
    ...planDefinitions.normal,
    ...planRuntimeFields("normal")
  };
}

function planRuntimeFields(planType: string | null | undefined) {
  const entitlements = getPlanEntitlements(planType);
  return {
    aiRequestsPerMinute: entitlements.aiRequestsPerMinute,
    customTheme: entitlements.customTheme,
    auditLog: entitlements.auditLogs === true,
    advancedSettings: entitlements.advancedSettings === true
  };
}

function canonicalPlan(plan: PlanLimits | null | undefined): PlanLimits {
  const slug = normalizePlanSlug(plan?.type);
  return {
    ...planDefinitions[slug],
    ...planRuntimeFields(slug),
    id: plan?.id,
    type: slug
  };
}

export function effectivePlanLimits(plan: PlanLimits | null | undefined, user?: PlanIdentity | null) {
  if (hasFullPlanAccess(user)) return platformFullAccessPlan;
  return plan ? canonicalPlan(plan) : fallbackPlan();
}

type BusinessPlanSource = {
  plan?: PlanLimits | null;
  subscription?: { plan?: PlanLimits | null; status?: string | null } | null;
  planType?: string | null;
  owner?: PlanIdentity | null;
} | null | undefined;

export function getPlanLimits(plan: PlanLimits | null | undefined, user?: PlanIdentity | null) {
  return effectivePlanLimits(plan, user);
}

export function getBusinessPlan(business: BusinessPlanSource, user?: PlanIdentity | null) {
  const plan = business?.subscription?.plan ?? business?.plan ?? (business ? { ...fallbackPlan(), type: business.planType ?? undefined } : null);
  return effectivePlanLimits(plan, user ?? business?.owner ?? null);
}

export function planDisplayName(plan: PlanLimits | null | undefined, user?: PlanIdentity | null) {
  return effectivePlanLimits(plan, user).name ?? fallbackPlan().name;
}

export function allowedTemplatesForPlan(plan: PlanLimits | null | undefined) {
  const effectivePlan = effectivePlanLimits(plan);
  if (!planCanUseFeature(effectivePlan.type, FEATURE_KEYS.catalogTemplateChange)) return [];
  const maxTemplates = Math.max(1, effectivePlan.maxTemplates ?? fallbackPlan().maxTemplates);
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
  const effectivePlan = effectivePlanLimits(plan);
  if (planCanUseFeature(effectivePlan.type, FEATURE_KEYS.catalogBrandingChange)) return;
  if (brandingChanged(currentSettings, settings) && usesAdvancedBranding(settings)) {
    throw new PlanAccessError("Tu plan actual no incluye branding avanzado");
  }
}

export async function getPlanLimitsForBusiness(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { plan: true, subscription: { include: { plan: true } }, owner: true }
  });

  return getBusinessPlan(business);
}

export async function getStorePlan(businessId: string) {
  return getPlanLimitsForBusiness(businessId);
}

export type PlanFeature =
  | FeatureKey
  | "ai"
  | "advancedBranding"
  | "advancedSeo"
  | "analytics"
  | "pageBuilder"
  | "advancedAttributes"
  | "quotesAndOrders"
  | "customDomain";

function legacyFeatureToKey(feature: PlanFeature): FeatureKey {
  if (feature === "ai") return FEATURE_KEYS.aiBasic;
  if (feature === "advancedBranding") return FEATURE_KEYS.catalogBrandingChange;
  if (feature === "advancedSeo") return FEATURE_KEYS.analyticsAdvanced;
  if (feature === "analytics") return FEATURE_KEYS.analyticsBasic;
  if (feature === "pageBuilder") return FEATURE_KEYS.catalogTemplateChange;
  if (feature === "advancedAttributes") return FEATURE_KEYS.productsAdvancedInventory;
  if (feature === "quotesAndOrders") return FEATURE_KEYS.quotesOrders;
  if (feature === "customDomain") return FEATURE_KEYS.customDomainUse;
  return feature;
}

function featureEnabled(plan: PlanLimits, feature: PlanFeature) {
  if (plan.type === platformFullAccessPlan.type) return true;
  return planCanUseFeature(plan.type, legacyFeatureToKey(feature));
}

export async function requireFeature(businessId: string, feature: PlanFeature) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (!featureEnabled(plan, feature)) {
    await auditBlocked({
      businessId,
      action: "plan_feature_blocked",
      entityType: "PlanFeature",
      entityId: legacyFeatureToKey(feature),
      metadata: {
        plan: plan.type,
        feature: legacyFeatureToKey(feature),
        attemptedAction: legacyFeatureToKey(feature)
      }
    }).catch(() => undefined);
    throw new PlanAccessError();
  }
  return plan;
}

export type PlanLimitType = "products" | "categories" | "members" | "images" | "stores";

function limitTypeToKey(limitType: PlanLimitType): PlanLimitKey {
  if (limitType === "products") return "maxProducts";
  if (limitType === "categories") return "maxCategories";
  if (limitType === "members") return "maxUsersPerStore";
  if (limitType === "images") return "maxImages";
  return "maxStores";
}

function limitLabel(limitType: PlanLimitType) {
  if (limitType === "products") return "productos";
  if (limitType === "categories") return "categorias";
  if (limitType === "members") return "usuarios";
  if (limitType === "images") return "imagenes";
  return "tiendas";
}

function limitErrorMessage(limitType: PlanLimitType, limit: number) {
  if (limitType === "products") {
    return "Tu plan actual alcanzó el límite de productos.";
  }
  if (limitType === "images") return "Tu plan actual alcanzó el límite de imágenes.";
  if (limitType === "members") {
    return "Tu plan actual alcanzó el límite de usuarios.";
  }
  return `No puedes agregar mas ${limitLabel(limitType)}: tu plan actual permite hasta ${limit}.`;
}

function planLimitBlockedAction(limitType: PlanLimitType) {
  if (limitType === "products") return "product_plan_limit_blocked";
  if (limitType === "images") return "upload_plan_limit_blocked";
  if (limitType === "categories") return "category_plan_limit_blocked";
  if (limitType === "members") return "user_plan_limit_blocked";
  return "plan_limit_blocked";
}

function planAttemptedAction(limitType: PlanLimitType) {
  if (limitType === "products") return "create_product";
  if (limitType === "images") return "upload_image";
  if (limitType === "categories") return "create_category";
  if (limitType === "members") return "invite_member";
  return "create_store";
}

export async function assertWithinPlanLimit(businessId: string, limitType: PlanLimitType, currentCount?: number) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (plan.type === platformFullAccessPlan.type) return plan;
  const limit = limitToNumber(getLimit(plan.type, limitTypeToKey(limitType)));
  if (!Number.isFinite(limit) || limit < 0) return plan;

  let count = currentCount;
  if (typeof count !== "number") {
    if (limitType === "products") count = await prisma.product.count({ where: { businessId } });
    if (limitType === "categories") count = await prisma.category.count({ where: { businessId } });
    if (limitType === "members") count = await prisma.membership.count({ where: { businessId } });
  }

  if ((count ?? 0) >= limit) {
    await auditBlocked({
      businessId,
      action: planLimitBlockedAction(limitType),
      entityType: "PlanLimit",
      entityId: limitTypeToKey(limitType),
      metadata: {
        plan: plan.type,
        limit,
        currentUsage: count ?? 0,
        limitType,
        attemptedAction: planAttemptedAction(limitType)
      }
    }).catch(() => undefined);
    throw new PlanAccessError(limitErrorMessage(limitType, limit));
  }
  return plan;
}

export async function requirePlanLimit(businessId: string, limitType: PlanLimitType, currentCount?: number) {
  return assertWithinPlanLimit(businessId, limitType, currentCount);
}

export async function requireMaxProducts(businessId: string, currentCount?: number) {
  return assertWithinPlanLimit(businessId, "products", currentCount);
}

export async function requireMaxImages(businessId: string, currentCount?: number) {
  return assertWithinPlanLimit(businessId, "images", currentCount);
}

export async function requireMaxUsers(businessId: string, currentCount?: number) {
  return assertWithinPlanLimit(businessId, "members", currentCount);
}

export async function requireAdvancedCustomTheme(
  businessId: string,
  input?: { userId?: string | null; attemptedAction?: string }
) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (plan.customTheme === "advanced") return plan;

  await auditBlocked({
    userId: input?.userId ?? null,
    businessId,
    action: "appearance_plan_limit_blocked",
    entityType: "PlanEntitlement",
    entityId: "customTheme",
    metadata: {
      plan: plan.type,
      limit: "advanced",
      currentUsage: plan.customTheme ?? "basic",
      attemptedAction: input?.attemptedAction ?? "update_appearance"
    }
  }).catch(() => undefined);

  throw new PlanAccessError("Tu plan actual no permite personalización avanzada.");
}

export async function requireAdvancedSettings(
  businessId: string,
  input?: { userId?: string | null; attemptedAction?: string }
) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (plan.advancedSettings) return plan;

  await auditBlocked({
    userId: input?.userId ?? null,
    businessId,
    action: "settings_plan_limit_blocked",
    entityType: "PlanEntitlement",
    entityId: "advancedSettings",
    metadata: {
      plan: plan.type,
      limit: true,
      currentUsage: false,
      attemptedAction: input?.attemptedAction ?? "update_business_settings"
    }
  }).catch(() => undefined);

  throw new PlanAccessError("Tu plan actual no permite ajustes avanzados.");
}

export function aiRequestsPerMinuteForPlan(plan: PlanLimits | null | undefined) {
  const effectivePlan = effectivePlanLimits(plan);
  if (typeof effectivePlan.aiRequestsPerMinute === "number") return effectivePlan.aiRequestsPerMinute;
  return getPlanEntitlements(effectivePlan.type).aiRequestsPerMinute;
}

export async function canCreateProduct(businessId: string) {
  await requireMaxProducts(businessId);
  return true;
}

export async function canUploadImage(businessId: string, currentImageCount?: number) {
  await requireMaxImages(businessId, currentImageCount);
  return true;
}

export async function canUseAI(businessId: string) {
  return requireFeature(businessId, FEATURE_KEYS.aiBasic);
}

export async function canInviteMember(businessId: string) {
  await requireMaxUsers(businessId);
  return true;
}

export async function assertQuotesAndOrdersAllowed(businessId: string) {
  await requireFeature(businessId, FEATURE_KEYS.quotesOrders);
}
