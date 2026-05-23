import { prisma } from "@/lib/db";
import { hasPlatformAccess } from "@/lib/auth";
import { CatalogTemplate } from "@/lib/enums";
import { planDefinitions } from "@/lib/plans";

type PlanLimits = {
  type?: string;
  name?: string;
  maxTemplates: number;
  maxProducts?: number;
  maxAiConversationsMonthly?: number;
  maxUsers?: number;
  advancedBranding: boolean;
  quotesAndOrders: boolean;
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
  maxAiConversationsMonthly: 999999,
  maxUsers: 999999,
  maxTemplates: TEMPLATE_ACCESS_ORDER.length,
  advancedBranding: true,
  quotesAndOrders: true
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
  if (hasPlatformAccess(user)) return platformFullAccessPlan;
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

export async function assertQuotesAndOrdersAllowed(businessId: string) {
  const plan = await getPlanLimitsForBusiness(businessId);
  if (!plan.quotesAndOrders) {
    throw new PlanAccessError("Tu plan actual no incluye cotizaciones y pedidos");
  }
}
