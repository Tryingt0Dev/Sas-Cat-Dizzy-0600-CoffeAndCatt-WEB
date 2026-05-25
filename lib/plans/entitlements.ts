import { FEATURE_KEYS, type FeatureKey } from "@/lib/plans/feature-keys";
import { UNLIMITED, type PlanEntitlements, type PlanLimitKey, type PlanSlug } from "@/lib/plans/plan-types";

export const PLAN_ENTITLEMENTS: Record<PlanSlug, PlanEntitlements> = {
  normal: {
    maxStores: 1,
    maxProducts: 50,
    maxUsersPerStore: 1,
    maxStorageMb: 512,
    maxAiConversationsMonthly: 100,
    maxImages: 100,
    maxCategories: 20,
    aiAssistant: "basic",
    advancedAI: false,
    analytics: "basic",
    advancedAnalytics: false,
    automations: false,
    customCatalogPalettes: true,
    saasThemeSelection: true,
    catalogTemplateSelection: true,
    advancedBranding: true,
    basicStoreSettings: true,
    integrations: false,
    exportReports: false,
    prioritySupport: false,
    customDomain: false,
    bulkProductImport: false,
    inventoryAdvanced: false,
    quotesAndOrders: true
  },
  premium: {
    maxStores: 3,
    maxProducts: 500,
    maxUsersPerStore: 5,
    maxStorageMb: 5120,
    maxAiConversationsMonthly: 5000,
    maxImages: 2000,
    maxCategories: 80,
    aiAssistant: "standard",
    advancedAI: true,
    analytics: "standard",
    advancedAnalytics: true,
    automations: true,
    customCatalogPalettes: true,
    saasThemeSelection: true,
    catalogTemplateSelection: true,
    advancedBranding: true,
    basicStoreSettings: true,
    integrations: "basic",
    exportReports: true,
    prioritySupport: false,
    customDomain: false,
    bulkProductImport: true,
    inventoryAdvanced: true,
    quotesAndOrders: true
  },
  business: {
    maxStores: UNLIMITED,
    maxProducts: UNLIMITED,
    maxUsersPerStore: UNLIMITED,
    maxStorageMb: UNLIMITED,
    maxAiConversationsMonthly: UNLIMITED,
    maxImages: UNLIMITED,
    maxCategories: UNLIMITED,
    aiAssistant: "advanced",
    advancedAI: true,
    analytics: "advanced",
    advancedAnalytics: true,
    automations: true,
    customCatalogPalettes: true,
    saasThemeSelection: true,
    catalogTemplateSelection: true,
    advancedBranding: true,
    basicStoreSettings: true,
    integrations: "advanced",
    exportReports: true,
    prioritySupport: true,
    customDomain: true,
    bulkProductImport: true,
    inventoryAdvanced: true,
    multiBranch: true,
    auditLogs: true,
    teamPermissionsAdvanced: true,
    quotesAndOrders: true
  }
};

export const PLAN_LIMIT_LABELS: Record<PlanLimitKey, string> = {
  maxStores: "Tiendas",
  maxProducts: "Productos",
  maxUsersPerStore: "Usuarios por tienda",
  maxStorageMb: "Almacenamiento",
  maxAiConversationsMonthly: "Conversaciones IA mensuales",
  maxImages: "Imagenes",
  maxCategories: "Categorias"
};

export function entitlementAllowsFeature(entitlements: PlanEntitlements, feature: FeatureKey) {
  if (feature === FEATURE_KEYS.productsCreate) return true;
  if (feature === FEATURE_KEYS.productsBulkImport) return entitlements.bulkProductImport;
  if (feature === FEATURE_KEYS.productsAdvancedInventory) return entitlements.inventoryAdvanced;
  if (feature === FEATURE_KEYS.storesCreate) return true;
  if (feature === FEATURE_KEYS.usersInvite) return true;
  if (feature === FEATURE_KEYS.aiBasic) return Boolean(entitlements.aiAssistant);
  if (feature === FEATURE_KEYS.aiAdvanced) return entitlements.advancedAI;
  if (feature === FEATURE_KEYS.analyticsBasic) return true;
  if (feature === FEATURE_KEYS.analyticsAdvanced) return entitlements.advancedAnalytics;
  if (feature === FEATURE_KEYS.automationsUse) return entitlements.automations;
  if (feature === FEATURE_KEYS.reportsExport) return entitlements.exportReports;
  if (feature === FEATURE_KEYS.integrationsBasic) return entitlements.integrations === "basic" || entitlements.integrations === "advanced";
  if (feature === FEATURE_KEYS.integrationsAdvanced) return entitlements.integrations === "advanced";
  if (feature === FEATURE_KEYS.catalogPaletteChange) return entitlements.customCatalogPalettes;
  if (feature === FEATURE_KEYS.catalogTemplateChange) return entitlements.catalogTemplateSelection;
  if (feature === FEATURE_KEYS.catalogBrandingChange) return entitlements.advancedBranding;
  if (feature === FEATURE_KEYS.saasThemeChange) return entitlements.saasThemeSelection;
  if (feature === FEATURE_KEYS.storeSettingsBasic) return entitlements.basicStoreSettings;
  if (feature === FEATURE_KEYS.customDomainUse) return entitlements.customDomain;
  if (feature === FEATURE_KEYS.supportPriority) return entitlements.prioritySupport;
  if (feature === FEATURE_KEYS.auditLogsView) return entitlements.auditLogs === true;
  if (feature === FEATURE_KEYS.teamAdvancedPermissions) return entitlements.teamPermissionsAdvanced === true;
  if (feature === FEATURE_KEYS.quotesOrders) return entitlements.quotesAndOrders;
  return false;
}
