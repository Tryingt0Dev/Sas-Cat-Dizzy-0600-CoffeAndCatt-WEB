#!/usr/bin/env tsx
try {
  // optional dotenv
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv/config');
} catch {}

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();
const email = process.argv[2] || 'felipebustamante003@gmail.com';
const password = process.argv[3] || 'TempPass123!';
const name = process.argv[4] || 'Felipe Bustamante';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.email);
    process.exit(0);
  }

  const pwdHash = await hashPassword(password);

  const slugBase = `tienda-${Date.now().toString().slice(-6)}`;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: pwdHash,
      emailVerifiedAt: new Date()
    }
  });

  const business = await prisma.business.create({
    data: {
      ownerId: user.id,
      name: `${name} Store`,
      slug: slugBase,
      publicSlug: slugBase,
      description: `Tienda creada manualmente para ${name}`
    }
  });

  await prisma.membership.create({ data: { userId: user.id, businessId: business.id, role: 'STORE_OWNER' } });

  console.log('Created user:', { id: user.id, email: user.email });
  console.log('Temporary password:', password);
  console.log('Created business:', { id: business.id, slug: slugBase });
  console.log('You can now sign in at http://localhost:3000/login');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
