-- AlterTable
ALTER TABLE "Product" ADD COLUMN "attributesJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "variantsJson" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "planId" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'FREE',
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
INSERT INTO "new_Business" ("accentColor", "address", "backgroundColor", "bannerUrl", "businessType", "buttonRadius", "catalogTemplate", "createdAt", "currency", "dashboardSubtitle", "dashboardTitle", "description", "id", "instagramUrl", "isActive", "logoUrl", "name", "ownerId", "planId", "planType", "primaryColor", "publicSlug", "secondaryColor", "slug", "textColor", "updatedAt", "whatsappNumber") SELECT "accentColor", "address", "backgroundColor", "bannerUrl", "businessType", "buttonRadius", "catalogTemplate", "createdAt", "currency", "dashboardSubtitle", "dashboardTitle", "description", "id", "instagramUrl", "isActive", "logoUrl", "name", "ownerId", "planId", "planType", "primaryColor", "publicSlug", "secondaryColor", "slug", "textColor", "updatedAt", "whatsappNumber" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_publicSlug_key" ON "Business"("publicSlug");
CREATE INDEX "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX "Business_planId_idx" ON "Business"("planId");
CREATE INDEX "Business_publicSlug_isActive_idx" ON "Business"("publicSlug", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
