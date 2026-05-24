import { headers } from "next/headers";
import { prisma } from "@/lib/db";

type AuditInput = {
  userId?: string | null;
  businessId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};

function safeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return null;
  try {
    return JSON.stringify(metadata);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

export async function writeAuditLog(input: AuditInput) {
  let headerStore: Awaited<ReturnType<typeof headers>> | null = null;
  try {
    headerStore = await headers();
  } catch {
    headerStore = null;
  }
  const forwardedFor = headerStore?.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || headerStore?.get("x-real-ip") || null;
  const userAgent = headerStore?.get("user-agent") || null;

  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      businessId: input.businessId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      metadata: safeMetadata(input.metadata),
      ip,
      userAgent
    }
  });
}
