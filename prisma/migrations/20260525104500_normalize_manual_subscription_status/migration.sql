-- Before a real payment provider exists, local/manual subscriptions should be active by default.
-- Provider-backed trialing subscriptions can keep their trial state in future integrations.
UPDATE "Subscription"
SET "status" = 'active',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'trialing'
  AND "provider" IS NULL
  AND "providerSubscriptionId" IS NULL;
