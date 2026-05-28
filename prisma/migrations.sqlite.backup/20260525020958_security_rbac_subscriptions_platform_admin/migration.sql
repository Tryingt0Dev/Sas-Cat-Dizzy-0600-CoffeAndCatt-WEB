-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxProducts" INTEGER NOT NULL,
    "maxImages" INTEGER NOT NULL DEFAULT 100,
    "maxCategories" INTEGER NOT NULL DEFAULT 10,
    "maxAiConversationsMonthly" INTEGER NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 1,
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "maxTemplates" INTEGER NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "advancedBranding" BOOLEAN NOT NULL DEFAULT false,
    "advancedSeoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pageBuilderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "advancedAttributesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quotesAndOrders" BOOLEAN NOT NULL DEFAULT false,
    "customDomain" BOOLEAN NOT NULL DEFAULT false,
    "supportLevel" TEXT NOT NULL DEFAULT 'community',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("advancedBranding", "createdAt", "customDomain", "id", "maxAiConversationsMonthly", "maxCategories", "maxProducts", "maxStores", "maxTemplates", "maxUsers", "name", "quotesAndOrders", "type", "updatedAt") SELECT "advancedBranding", "createdAt", "customDomain", "id", "maxAiConversationsMonthly", "maxCategories", "maxProducts", "maxStores", "maxTemplates", "maxUsers", "name", "quotesAndOrders", "type", "updatedAt" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE UNIQUE INDEX "Plan_type_key" ON "Plan"("type");
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
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
INSERT INTO "new_Subscription" ("businessId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "provider", "providerCustomerId", "providerSubscriptionId", "status", "updatedAt") SELECT "businessId", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "provider", "providerCustomerId", "providerSubscriptionId", "status", "updatedAt" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_businessId_key" ON "Subscription"("businessId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_providerSubscriptionId_idx" ON "Subscription"("providerSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "PlatformSetting_key_idx" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "Category_businessId_createdAt_idx" ON "Category"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_businessId_sku_idx" ON "Product"("businessId", "sku");

-- CreateIndex
CREATE INDEX "Product_businessId_categoryId_idx" ON "Product"("businessId", "categoryId");

-- CreateIndex
CREATE INDEX "Product_businessId_status_idx" ON "Product"("businessId", "status");
