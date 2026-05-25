export const PLAN_SLUGS = ["normal", "premium", "business"] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

export const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "canceled", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const UNLIMITED = "unlimited" as const;
export type Unlimited = typeof UNLIMITED;
export type PlanLimitValue = number | Unlimited;

export type AiAssistantLevel = "basic" | "standard" | "advanced";
export type AnalyticsLevel = "basic" | "standard" | "advanced";
export type IntegrationLevel = false | "basic" | "advanced";

export type PlanEntitlements = {
  maxStores: PlanLimitValue;
  maxProducts: PlanLimitValue;
  maxUsersPerStore: PlanLimitValue;
  maxStorageMb: PlanLimitValue;
  maxAiConversationsMonthly: PlanLimitValue;
  maxImages: PlanLimitValue;
  maxCategories: PlanLimitValue;
  aiAssistant: AiAssistantLevel;
  advancedAI: boolean;
  analytics: AnalyticsLevel;
  advancedAnalytics: boolean;
  automations: boolean;
  customCatalogPalettes: boolean;
  saasThemeSelection: boolean;
  catalogTemplateSelection: boolean;
  advancedBranding: boolean;
  basicStoreSettings: boolean;
  integrations: IntegrationLevel;
  exportReports: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
  bulkProductImport: boolean;
  inventoryAdvanced: boolean;
  multiBranch?: boolean;
  auditLogs?: boolean;
  teamPermissionsAdvanced?: boolean;
  quotesAndOrders: boolean;
};

export type PlanDefinition = {
  slug: PlanSlug;
  type: PlanSlug;
  name: string;
  description: string;
};

export type PlanLimitKey =
  | "maxStores"
  | "maxProducts"
  | "maxUsersPerStore"
  | "maxStorageMb"
  | "maxAiConversationsMonthly"
  | "maxImages"
  | "maxCategories";

const legacyPlanMap: Record<string, PlanSlug> = {
  FREE: "normal",
  STARTER: "premium",
  PRO: "premium",
  BUSINESS: "business",
  ENTERPRISE: "business",
  NORMAL: "normal",
  PREMIUM: "premium"
};

export function isPlanSlug(value: string | null | undefined): value is PlanSlug {
  return PLAN_SLUGS.includes(value as PlanSlug);
}

export function normalizePlanSlug(value: string | null | undefined): PlanSlug {
  if (!value) return "normal";
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (isPlanSlug(lower)) return lower;
  return legacyPlanMap[trimmed.toUpperCase()] ?? "normal";
}

export function isSubscriptionStatus(value: string | null | undefined): value is SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus);
}

export function normalizeSubscriptionStatus(value: string | null | undefined): SubscriptionStatus {
  if (!value) return "active";
  const normalized = value.trim().toLowerCase();
  if (normalized === "suspended") return "past_due";
  if (isSubscriptionStatus(normalized)) return normalized;
  return "active";
}

export function isUnlimited(value: PlanLimitValue): value is Unlimited {
  return value === UNLIMITED;
}

export function limitToNumber(value: PlanLimitValue) {
  return isUnlimited(value) ? Number.POSITIVE_INFINITY : value;
}

export function formatPlanLimit(value: PlanLimitValue) {
  return isUnlimited(value) ? "Ilimitado" : new Intl.NumberFormat("es-CL").format(value);
}
