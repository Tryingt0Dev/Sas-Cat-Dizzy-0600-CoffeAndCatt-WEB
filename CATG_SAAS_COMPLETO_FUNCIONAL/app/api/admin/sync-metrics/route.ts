import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_req: Request) {
  // Compute a small set of owner-level metrics and return them.
  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const revenues = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: "PAID", createdAt: { gte: thirty } }
  });

  const mrrEstimate = revenues._sum.total ?? 0;
  const subscriptionsActive = await prisma.subscription.count({ where: { status: "active" } });
  const totalSubscriptions = await prisma.subscription.count();
  const nonActiveRecently = await prisma.subscription.count({ where: { status: { not: "active" }, updatedAt: { gte: thirty } } });
  const churnPercent = totalSubscriptions === 0 ? 0 : Math.round((nonActiveRecently / totalSubscriptions) * 1000) / 10;
  const newStores30d = await prisma.business.count({ where: { createdAt: { gte: thirty } } });

  return NextResponse.json({ ok: true, mrrEstimate, subscriptionsActive, churnPercent, newStores30d });
}
