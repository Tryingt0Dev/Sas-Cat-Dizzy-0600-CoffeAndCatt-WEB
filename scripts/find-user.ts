#!/usr/bin/env tsx
try {
  // Load .env if dotenv is installed (optional); avoid crash if not present in env
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch {
  // ignore
}
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx scripts/find-user.ts user@example.com');
  process.exit(2);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!user) {
    console.log(`No user found with email ${email}`);
    process.exit(0);
  }
  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
