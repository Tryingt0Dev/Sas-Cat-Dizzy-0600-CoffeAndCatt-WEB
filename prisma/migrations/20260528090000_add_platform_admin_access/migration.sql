-- CreateTable
CREATE TABLE "PlatformAdminAccess" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdByEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAdminAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdminAccess_email_key" ON "PlatformAdminAccess"("email");

-- CreateIndex
CREATE INDEX "PlatformAdminAccess_email_idx" ON "PlatformAdminAccess"("email");

-- CreateIndex
CREATE INDEX "PlatformAdminAccess_role_idx" ON "PlatformAdminAccess"("role");

-- CreateIndex
CREATE INDEX "PlatformAdminAccess_enabled_idx" ON "PlatformAdminAccess"("enabled");

-- Bootstrap primary platform owner. This is also enforced in code as a fallback.
INSERT INTO "PlatformAdminAccess" ("id", "email", "role", "enabled", "createdByEmail", "notes", "createdAt", "updatedAt")
VALUES (
    'platform-owner-felipebustamante003',
    'felipebustamante003@gmail.com',
    'OWNER',
    true,
    'system',
    'Dueño principal de la plataforma CATG Omniventas.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO UPDATE SET
    "role" = 'OWNER',
    "enabled" = true,
    "updatedAt" = CURRENT_TIMESTAMP;
