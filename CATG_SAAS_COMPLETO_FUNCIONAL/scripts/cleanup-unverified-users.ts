#!/usr/bin/env tsx
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit-log";

async function main() {
  const hours = Number(process.env.CLEANUP_UNVERIFIED_HOURS || "72");
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  console.log(`Cleanup: removing unverified users created before ${cutoff.toISOString()}`);

  // Remove expired tokens first
  const deletedTokens = await prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  console.log(`Deleted ${deletedTokens.count} expired verification tokens`);

  const candidates = await prisma.user.findMany({
    where: { emailVerifiedAt: null, createdAt: { lt: cutoff } },
    include: { businesses: { include: { subscription: true } } }
  });

  let removed = 0;
  for (const user of candidates) {
    const hasActiveBusiness = user.businesses.some((b) => b.isActive || (b.subscription && b.subscription.status === "active"));
    if (hasActiveBusiness) {
      await writeAuditLog({ userId: user.id, action: "unverified_user_skipped", resourceType: "User", metadata: { reason: "has_active_business" } });
      continue;
    }

    try {
      await prisma.user.delete({ where: { id: user.id } });
      removed++;
      await writeAuditLog({ userId: user.id, action: "unverified_user_deleted", resourceType: "User", metadata: { createdAt: user.createdAt.toISOString() } });
    } catch (err) {
      console.error("Failed to delete user", user.id, err);
    }
  }

  console.log(`Removed ${removed} unverified users`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
