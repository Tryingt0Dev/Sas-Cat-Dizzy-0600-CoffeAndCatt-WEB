-- Add commercial plan metadata for normal/premium/business.
ALTER TABLE "Plan" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

INSERT INTO "Plan" (
    "id",
    "type",
    "name",
    "description",
    "maxProducts",
    "maxImages",
    "maxCategories",
    "maxAiConversationsMonthly",
    "maxUsers",
    "maxMembers",
    "maxStores",
    "maxTemplates",
    "aiEnabled",
    "advancedBranding",
    "advancedSeoEnabled",
    "analyticsEnabled",
    "pageBuilderEnabled",
    "advancedAttributesEnabled",
    "quotesAndOrders",
    "customDomain",
    "supportLevel",
    "createdAt",
    "updatedAt"
) VALUES
    (
        'plan_normal',
        'normal',
        'Normal',
        'Plan base para tiendas pequenas o usuarios que recien comienzan.',
        50,
        100,
        20,
        100,
        1,
        1,
        1,
        4,
        true,
        true,
        false,
        false,
        false,
        false,
        true,
        false,
        'standard',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'plan_premium',
        'premium',
        'Premium',
        'Plan avanzado para tiendas en crecimiento con mas personalizacion, IA y reportes.',
        500,
        2000,
        80,
        5000,
        5,
        5,
        3,
        4,
        true,
        true,
        true,
        true,
        false,
        true,
        true,
        false,
        'priority',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'plan_business',
        'business',
        'Business',
        'Plan profesional para negocios con mayor volumen, equipo, automatizaciones e integraciones.',
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        4,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        'priority',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT("type") DO UPDATE SET
    "name" = excluded."name",
    "description" = excluded."description",
    "maxProducts" = excluded."maxProducts",
    "maxImages" = excluded."maxImages",
    "maxCategories" = excluded."maxCategories",
    "maxAiConversationsMonthly" = excluded."maxAiConversationsMonthly",
    "maxUsers" = excluded."maxUsers",
    "maxMembers" = excluded."maxMembers",
    "maxStores" = excluded."maxStores",
    "maxTemplates" = excluded."maxTemplates",
    "aiEnabled" = excluded."aiEnabled",
    "advancedBranding" = excluded."advancedBranding",
    "advancedSeoEnabled" = excluded."advancedSeoEnabled",
    "analyticsEnabled" = excluded."analyticsEnabled",
    "pageBuilderEnabled" = excluded."pageBuilderEnabled",
    "advancedAttributesEnabled" = excluded."advancedAttributesEnabled",
    "quotesAndOrders" = excluded."quotesAndOrders",
    "customDomain" = excluded."customDomain",
    "supportLevel" = excluded."supportLevel",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Normalize business plan slugs and defaults without deleting legacy plan rows.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "planId" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'normal',
    "name" TEXT NOT NULL,
    "dashboardTitle" TEXT,
    "dashboardSubtitle" TEXT,
    "slug" TEXT NOT NULL,
    "publicSlug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "catalogTemplate" TEXT NOT NULL DEFAULT 'MODERN_GRID',
    "primaryColor" TEXT NOT NULL DEFAULT '#111827',
    "secondaryColor" TEXT NOT NULL DEFAULT '#F9FAFB',
    "accentColor" TEXT NOT NULL DEFAULT '#E11D48',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "catalogPalette" TEXT NOT NULL DEFAULT 'minimal-arena',
    "buttonRadius" INTEGER NOT NULL DEFAULT 18,
    "whatsappNumber" TEXT,
    "instagramUrl" TEXT,
    "businessType" TEXT,
    "address" TEXT,
    "welcomeMessage" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "showFeaturedCategories" BOOLEAN NOT NULL DEFAULT true,
    "showFeaturedProducts" BOOLEAN NOT NULL DEFAULT true,
    "currency" TEXT NOT NULL DEFAULT 'CLP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Business_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Business" (
    "accentColor",
    "address",
    "backgroundColor",
    "bannerUrl",
    "businessType",
    "buttonRadius",
    "catalogPalette",
    "catalogTemplate",
    "createdAt",
    "currency",
    "dashboardSubtitle",
    "dashboardTitle",
    "description",
    "id",
    "instagramUrl",
    "isActive",
    "logoUrl",
    "name",
    "ownerId",
    "planId",
    "planType",
    "primaryColor",
    "publicSlug",
    "secondaryColor",
    "seoDescription",
    "seoKeywords",
    "seoTitle",
    "showFeaturedCategories",
    "showFeaturedProducts",
    "slug",
    "textColor",
    "updatedAt",
    "welcomeMessage",
    "whatsappNumber"
)
SELECT
    "accentColor",
    "address",
    "backgroundColor",
    "bannerUrl",
    "businessType",
    "buttonRadius",
    "catalogPalette",
    "catalogTemplate",
    "createdAt",
    "currency",
    "dashboardSubtitle",
    "dashboardTitle",
    "description",
    "id",
    "instagramUrl",
    "isActive",
    "logoUrl",
    "name",
    "ownerId",
    "planId",
    CASE
      WHEN UPPER("planType") = 'FREE' THEN 'normal'
      WHEN UPPER("planType") = 'STARTER' THEN 'premium'
      WHEN UPPER("planType") = 'PRO' THEN 'premium'
      WHEN UPPER("planType") = 'PREMIUM' THEN 'premium'
      WHEN UPPER("planType") = 'BUSINESS' THEN 'business'
      WHEN UPPER("planType") = 'ENTERPRISE' THEN 'business'
      WHEN LOWER("planType") IN ('normal', 'premium', 'business') THEN LOWER("planType")
      ELSE 'normal'
    END,
    "primaryColor",
    "publicSlug",
    "secondaryColor",
    "seoDescription",
    "seoKeywords",
    "seoTitle",
    "showFeaturedCategories",
    "showFeaturedProducts",
    "slug",
    "textColor",
    "updatedAt",
    "welcomeMessage",
    "whatsappNumber"
FROM "Business";

DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_publicSlug_key" ON "Business"("publicSlug");
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX "Business_planId_idx" ON "Business"("planId");
CREATE INDEX "Business_publicSlug_isActive_idx" ON "Business"("publicSlug", "isActive");

CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" DATETIME,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Subscription" (
    "businessId",
    "cancelAtPeriodEnd",
    "createdAt",
    "currentPeriodEnd",
    "currentPeriodStart",
    "id",
    "planId",
    "provider",
    "providerCustomerId",
    "providerSubscriptionId",
    "status",
    "updatedAt"
)
SELECT
    "businessId",
    "cancelAtPeriodEnd",
    "createdAt",
    "currentPeriodEnd",
    "currentPeriodStart",
    "id",
    "planId",
    "provider",
    "providerCustomerId",
    "providerSubscriptionId",
    CASE
      WHEN LOWER("status") = 'trialing' THEN 'trialing'
      WHEN LOWER("status") = 'active' THEN 'active'
      WHEN LOWER("status") = 'past_due' THEN 'past_due'
      WHEN LOWER("status") = 'canceled' THEN 'canceled'
      WHEN LOWER("status") = 'expired' THEN 'expired'
      WHEN LOWER("status") = 'suspended' THEN 'past_due'
      ELSE 'active'
    END,
    "updatedAt"
FROM "Subscription";

DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_businessId_key" ON "Subscription"("businessId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_providerSubscriptionId_idx" ON "Subscription"("providerSubscriptionId");

UPDATE "Business"
SET "planId" = (
  SELECT "id"
  FROM "Plan"
  WHERE "Plan"."type" = "Business"."planType"
  LIMIT 1
);

UPDATE "Subscription"
SET "planId" = (
  SELECT "Plan"."id"
  FROM "Business"
  JOIN "Plan" ON "Plan"."type" = "Business"."planType"
  WHERE "Business"."id" = "Subscription"."businessId"
  LIMIT 1
);

INSERT INTO "Subscription" (
    "id",
    "businessId",
    "planId",
    "status",
    "currentPeriodStart",
    "cancelAtPeriodEnd",
    "createdAt",
    "updatedAt"
)
SELECT
    'sub_' || "Business"."id",
    "Business"."id",
    "Plan"."id",
    'active',
    CURRENT_TIMESTAMP,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Business"
JOIN "Plan" ON "Plan"."type" = "Business"."planType"
WHERE NOT EXISTS (
    SELECT 1
    FROM "Subscription"
    WHERE "Subscription"."businessId" = "Business"."id"
);

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
