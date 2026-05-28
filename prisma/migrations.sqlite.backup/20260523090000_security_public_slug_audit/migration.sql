-- Add a configurable public slug separate from the internal business slug.
ALTER TABLE "Business" ADD COLUMN "publicSlug" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Plan" ADD COLUMN "maxCategories" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Plan" ADD COLUMN "maxStores" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN "customDomain" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Business"
SET "publicSlug" = "slug"
WHERE "publicSlug" = '';

CREATE UNIQUE INDEX "Business_publicSlug_key" ON "Business"("publicSlug");
CREATE INDEX "Business_publicSlug_isActive_idx" ON "Business"("publicSlug", "isActive");

-- Store-level roles. Existing owners become STORE_OWNER members.
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STORE_OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Membership" ("id", "userId", "businessId", "role", "createdAt", "updatedAt")
SELECT lower(hex(randomblob(16))), "ownerId", "id", 'STORE_OWNER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Business";

CREATE UNIQUE INDEX "Membership_userId_businessId_key" ON "Membership"("userId", "businessId");
CREATE INDEX "Membership_businessId_idx" ON "Membership"("businessId");
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- Public slug history enables permanent redirects after future slug changes.
CREATE TABLE "BusinessSlugHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BusinessSlugHistory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BusinessSlugHistory_slug_key" ON "BusinessSlugHistory"("slug");
CREATE INDEX "BusinessSlugHistory_businessId_idx" ON "BusinessSlugHistory"("businessId");

-- Audit trail for critical tenant/platform actions.
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "businessId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_businessId_idx" ON "AuditLog"("businessId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
