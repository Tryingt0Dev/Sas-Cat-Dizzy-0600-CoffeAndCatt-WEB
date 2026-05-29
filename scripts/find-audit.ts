#!/usr/bin/env tsx
try {
  // optional dotenv
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch {}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx scripts/find-audit.ts user@example.com');
  process.exit(2);
}

async function main() {
  const events = await prisma.auditLog.findMany({
    where: {
      OR: [
        { metadata: { contains: email } },
        { action: { contains: 'signup' } },
        { action: { contains: 'email_verification' } }
      ]
    },
    orderBy: { createdAt: 'desc' },
     take: 100
  });
  if (!events || events.length === 0) {
    console.log(`No audit events found for ${email}`);
    process.exit(0);
  }
  console.log(JSON.stringify(events, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
