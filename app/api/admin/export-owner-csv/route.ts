import { prisma } from "@/lib/db";
import { requirePlatformApiAccess } from "@/lib/api-security";

const MAX_EXPORT_RANGE_DAYS = 366;

function parseDateInput(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(req: Request) {
  const access = await requirePlatformApiAccess(req, {
    permission: "billing",
    action: "platform_admin.export_owner_csv",
    requireAllowedOrigin: true,
    rateLimit: { endpoint: "admin:export_owner_csv", limit: 10, windowMs: 15 * 60 * 1000 }
  });
  if (!access.ok) return access.response;

  const form = await req.formData();
  const startStr = form.get("start")?.toString();
  const endStr = form.get("end")?.toString();

  const start = parseDateInput(startStr) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = parseDateInput(endStr) ?? new Date();
  if (start > end) {
    return Response.json({ ok: false, error: "El rango de fechas no es valido." }, { status: 400 });
  }

  const rangeMs = end.getTime() - start.getTime();
  if (rangeMs > MAX_EXPORT_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    return Response.json({ ok: false, error: "El rango maximo de exportacion es de 366 dias." }, { status: 400 });
  }

  const businesses = await prisma.business.findMany({
    include: { owner: { select: { email: true } }, subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000
  });

  const revenues = await prisma.order.groupBy({
    by: ["businessId"],
    _sum: { total: true },
    where: { status: "PAID", createdAt: { gte: start, lte: end } }
  });

  const revenueMap = new Map(revenues.map((r) => [r.businessId, r._sum.total ?? 0]));

  const rows = [
    ["business_id", "name", "owner_email", "planType", "subscription_status", "revenue"]
  ];

  for (const b of businesses) {
    rows.push([
      b.id,
      b.name,
      b.owner?.email ?? "",
      b.planType ?? "",
      b.subscription?.status ?? "",
      String(revenueMap.get(b.id) ?? 0)
    ]);
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename=owner_report_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv`);

  return new Response(csv, { status: 200, headers });
}
