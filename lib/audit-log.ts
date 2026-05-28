import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { stringifyJsonSafely } from "@/lib/safe-json";

export type AuditResult = "success" | "failure" | "blocked";

type AuditLogInput = {
  userId?: string | null;
  businessId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  result?: AuditResult;
  metadata?: Record<string, unknown> | null;
  request?: Request | null;
};

const REDACTED = "[REDACTED]";
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 50;
const MAX_METADATA_LENGTH = 8_000;
const SENSITIVE_KEY_PATTERN = /(password|token|cookie|authorization|secret|api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|session|credential)/i;

function truncateString(value: string) {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
}

export function sanitizeAuditMetadata(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (typeof value === "string") return truncateString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof File) return { file: true, name: truncateString(value.name), type: value.type, size: value.size };
  if (value instanceof Blob) return { blob: true, type: value.type, size: value.size };
  if (depth >= 4) return "[MaxDepth]";

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeAuditMetadata(item, depth + 1));
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
    return Object.fromEntries(
      entries.map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeAuditMetadata(entryValue, depth + 1)
      ])
    );
  }

  return truncateString(String(value));
}

function metadataForStorage(metadata: Record<string, unknown> | null | undefined, result: AuditResult) {
  const sanitized = sanitizeAuditMetadata({ result, ...(metadata ?? {}) });
  const serialized = stringifyJsonSafely(sanitized);
  if (serialized.length <= MAX_METADATA_LENGTH) return serialized;
  return stringifyJsonSafely({
    result,
    truncated: true,
    size: serialized.length,
    preview: serialized.slice(0, MAX_METADATA_LENGTH)
  });
}

function requestIp(req: Request | null | undefined) {
  if (!req) return null;
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
  return forwardedFor.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

async function requestContext(req: Request | null | undefined) {
  if (req) {
    return {
      ip: requestIp(req),
      userAgent: req.headers.get("user-agent")?.slice(0, 300) || null
    };
  }

  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
    return {
      ip: forwardedFor.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null,
      userAgent: headerStore.get("user-agent")?.slice(0, 300) || null
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function writeAuditLog(input: AuditLogInput) {
  const result = input.result ?? "success";
  const { ip, userAgent } = await requestContext(input.request);

  try {
    return await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        businessId: input.businessId ?? null,
        action: input.action,
        resourceType: input.entityType ?? input.resourceType ?? "Unknown",
        resourceId: input.entityId ?? input.resourceId ?? null,
        metadata: metadataForStorage(input.metadata, result),
        ip,
        userAgent
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Audit log write failed", {
        action: input.action,
        result,
        type: error instanceof Error ? error.name : "UnknownError",
        timestamp: new Date().toISOString()
      });
    }
    return null;
  }
}

export function auditSuccess(input: Omit<AuditLogInput, "result">) {
  return writeAuditLog({ ...input, result: "success" });
}

export function auditFailure(input: Omit<AuditLogInput, "result">) {
  return writeAuditLog({ ...input, result: "failure" });
}

export function auditBlocked(input: Omit<AuditLogInput, "result">) {
  return writeAuditLog({ ...input, result: "blocked" });
}
