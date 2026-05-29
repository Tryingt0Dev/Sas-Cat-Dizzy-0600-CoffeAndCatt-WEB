import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  await requireSuperAdmin(req);
  const list = await prisma.business.findMany({ select: { id: true, name: true, publicSlug: true, ownerId: true, planId: true, customDomain: true, customDomainVerified: true, isActive: true } });
  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  await requireSuperAdmin(req);
  const body = await req.json().catch(() => ({}));
  const { businessId, planId } = body;
  if (!businessId || !planId) return NextResponse.json({ error: 'missing' }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'plan-not-found' }, { status: 404 });

  const updated = await prisma.business.update({ where: { id: businessId }, data: { planId } });
  return NextResponse.json({ data: updated });
}
