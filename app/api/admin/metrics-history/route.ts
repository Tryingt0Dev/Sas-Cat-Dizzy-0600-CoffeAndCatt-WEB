import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformApiAccess } from "@/lib/api-security";

function normalizeDays(value: string | null) {
  const days = Number(value) || 30;
  return Math.min(Math.max(Math.floor(days), 1), 90);
}

export async function GET(req: Request) {
  const access = await requirePlatformApiAccess(req, {
    permission: "billing",
    action: "platform_admin.metrics_history",
    rateLimit: { endpoint: "admin:metrics_history", limit: 60, windowMs: 10 * 60 * 1000 }
  });
  if (!access.ok) return access.response;

  const url = new URL(req.url);
  const days = normalizeDays(url.searchParams.get("days"));
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Paid orders in range
  const orders = await prisma.order.findMany({ where: { status: "PAID", createdAt: { gte: start, lte: end } }, select: { total: true, createdAt: true } });

  // New stores in range
  const newStores = await prisma.business.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { createdAt: true } });

  // Subscriptions that changed to non-active in range (approx churn events)
  const churnSubs = await prisma.subscription.findMany({ where: { status: { not: "active" }, updatedAt: { gte: start, lte: end } }, select: { updatedAt: true } });

  const revenueMap = new Map<string, number>();
  const newStoresMap = new Map<string, number>();
  const churnMap = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    revenueMap.set(key, 0);
    newStoresMap.set(key, 0);
    churnMap.set(key, 0);
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + (o.total ?? 0));
  }
  for (const s of newStores) {
    const key = s.createdAt.toISOString().slice(0, 10);
    newStoresMap.set(key, (newStoresMap.get(key) ?? 0) + 1);
  }
  for (const c of churnSubs) {
    const key = c.updatedAt.toISOString().slice(0, 10);
    churnMap.set(key, (churnMap.get(key) ?? 0) + 1);
  }

  const entries = Array.from(revenueMap.entries());
  const labels: string[] = [];
  const revenues: number[] = [];
  const newStoresValues: number[] = [];
  const churnValues: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][0];
    labels.push(key);
    revenues.push(revenueMap.get(key) ?? 0);
    newStoresValues.push(newStoresMap.get(key) ?? 0);
    churnValues.push(churnMap.get(key) ?? 0);
  }

  return NextResponse.json({ ok: true, labels, revenues, newStores: newStoresValues, churn: churnValues });
}
