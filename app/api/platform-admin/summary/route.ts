import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentPlatformAdminAccess } from "@/lib/platform-admin";
import { auditBlocked } from "@/services/audit-log";

export async function GET(req: Request) {
  const current = await getCurrentPlatformAdminAccess(req);
  if (!current?.access.enabled) {
    await auditBlocked({
      request: req,
      userId: current?.user.id ?? null,
      action: "platform_admin.api.summary.unauthorized",
      entityType: "PlatformAdmin"
    });
    return NextResponse.json({ ok: false, error: "No tienes permisos para acceder a esta sección." }, { status: 403 });
  }

  const [stores, users, activeSubscriptions, suspendedStores] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.business.count({ where: { isActive: false } })
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      stores,
      users,
      activeSubscriptions,
      suspendedStores,
      role: current.access.role
    }
  });
}
