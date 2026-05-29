-- Migration: add_email_verification_and_signup_hardening
BEGIN;

-- Rename usedAt to consumedAt if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='EmailVerificationToken' AND column_name='usedAt') THEN
    ALTER TABLE "EmailVerificationToken" RENAME COLUMN "usedAt" TO "consumedAt";
  END IF;
END$$;

-- Add requestIp column if not exists
ALTER TABLE "EmailVerificationToken" ADD COLUMN IF NOT EXISTS "requestIp" TEXT;

-- Ensure indexes for lookup by userId and expiration
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken" ("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken" ("expiresAt");

COMMIT;
