import crypto from "crypto";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { auditBlocked, auditSuccess } from "@/services/audit-log";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";
import { PlanAccessError, requireMaxImages } from "@/services/plan-guard";

export const runtime = "nodejs";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 1;
const UPLOAD_RATE_LIMIT = 30;
const DELETE_RATE_LIMIT = 30;
const UPLOAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DELETE_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", { canonicalExtension: "jpg", fileExtensions: ["jpg", "jpeg"] }],
  ["image/png", { canonicalExtension: "png", fileExtensions: ["png"] }],
  ["image/webp", { canonicalExtension: "webp", fileExtensions: ["webp"] }]
]);
const DANGEROUS_EXTENSIONS = new Set([
  "asp",
  "aspx",
  "bat",
  "cmd",
  "com",
  "dll",
  "exe",
  "html",
  "hta",
  "js",
  "jsp",
  "mjs",
  "msi",
  "pdf",
  "php",
  "phtml",
  "ps1",
  "scr",
  "sh",
  "svg",
  "ts",
  "tsx",
  "vb",
  "vbs"
]);

// Local development storage. Swap this route implementation for Supabase Storage,
// S3, Cloudinary or UploadThing without changing ImageDropzone consumers.

function invalidRequest(message = "Solicitud invalida", status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function storageRootForBusiness(businessId: string) {
  return path.resolve(process.cwd(), "public", "uploads", "businesses", businessId, "images");
}

function legacyStorageRootForBusiness(businessId: string) {
  return path.resolve(process.cwd(), "public", "uploads", businessId);
}

function uploadUrlForBusiness(businessId: string, fileName: string) {
  return `/uploads/businesses/${businessId}/images/${fileName}`;
}

function extensionFromFileName(name: string) {
  return path.extname(name).replace(".", "").toLowerCase();
}

function hasPathTraversal(value: string) {
  return value.includes("\0") || value.includes("/") || value.includes("\\") || value.split(".").some((part) => part === "..");
}

function validateOriginalFileName(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName || hasPathTraversal(trimmedName)) return false;

  const parts = trimmedName.split(".");
  if (parts.length < 2 || parts.some((part) => part.trim() === "")) return false;

  const dangerousMiddleExtension = parts
    .slice(1, -1)
    .some((extension) => DANGEROUS_EXTENSIONS.has(extension.toLowerCase()));
  return !dangerousMiddleExtension;
}

function storedFileNameIsSafe(fileName: string) {
  if (!fileName || hasPathTraversal(fileName)) return false;
  if (!/^[a-zA-Z0-9_.-]+$/.test(fileName)) return false;

  const extension = extensionFromFileName(fileName);
  if (!Array.from(ALLOWED_TYPES.values()).some((value) => value.fileExtensions.includes(extension))) return false;

  const parts = fileName.split(".");
  return !parts.slice(1, -1).some((part) => DANGEROUS_EXTENSIONS.has(part.toLowerCase()));
}

function detectImageExtension(bytes: Buffer) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= pngSignature.length && pngSignature.every((value, index) => bytes[index] === value)) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

async function countStoredImages(businessId: string) {
  const storageFiles = await readdir(storageRootForBusiness(businessId)).catch(() => []);
  const legacyFiles = await readdir(legacyStorageRootForBusiness(businessId)).catch(() => []);
  return [...storageFiles, ...legacyFiles].filter((file) => /\.(jpe?g|png|webp)$/i.test(file)).length;
}

function accessErrorResponse(error: unknown, action: "subir" | "borrar") {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ ok: false, error: `No autorizado para ${action} imagenes` }, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ ok: false, error: `No autorizado para ${action} imagenes` }, { status: 403 });
  }
  throw error;
}

async function auditUploadBlocked(input: {
  request: Request;
  businessId?: string | null;
  userId?: string | null;
  reason: string;
  mime?: string | null;
  size?: number | null;
  extension?: string | null;
}) {
  await auditBlocked({
    request: input.request,
    userId: input.userId ?? null,
    businessId: input.businessId ?? null,
    action: "upload_image_blocked",
    entityType: "Upload",
    metadata: {
      reason: input.reason,
      mime: input.mime ?? null,
      size: input.size ?? null,
      extension: input.extension ?? null
    }
  });
}

async function auditDeleteBlocked(input: {
  request: Request;
  businessId?: string | null;
  userId?: string | null;
  reason: string;
}) {
  await auditBlocked({
    request: input.request,
    userId: input.userId ?? null,
    businessId: input.businessId ?? null,
    action: "delete_image_blocked",
    entityType: "Upload",
    metadata: { reason: input.reason }
  });
}

function safeErrorType(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

function logUploadError(context: {
  action: "create" | "delete";
  businessId?: string | null;
  userId?: string | null;
  size?: number | null;
  mime?: string | null;
  error: unknown;
}) {
  if (process.env.NODE_ENV !== "development") return;
  console.error("Upload image error", {
    action: context.action,
    businessId: context.businessId ?? null,
    userId: context.userId ?? null,
    size: context.size ?? null,
    mime: context.mime ?? null,
    type: safeErrorType(context.error),
    timestamp: new Date().toISOString()
  });
}

function resolveInside(root: string, fileName: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, fileName);
  if (!resolvedFile.startsWith(resolvedRoot + path.sep)) return null;
  return resolvedFile;
}

function uploadTargetFromUrl(url: string, businessId: string) {
  const trimmedUrl = url.trim();
  if (
    !trimmedUrl ||
    trimmedUrl.includes("\0") ||
    trimmedUrl.includes("\\") ||
    trimmedUrl.includes("?") ||
    trimmedUrl.includes("#")
  ) {
    return null;
  }

  const storagePrefix = `/uploads/businesses/${businessId}/images/`;
  if (trimmedUrl.startsWith(storagePrefix)) {
    const fileName = trimmedUrl.slice(storagePrefix.length);
    if (!storedFileNameIsSafe(fileName)) return null;
    return {
      fileName,
      absolutePath: resolveInside(storageRootForBusiness(businessId), fileName)
    };
  }

  const legacyPrefix = `/uploads/${businessId}/`;
  if (trimmedUrl.startsWith(legacyPrefix)) {
    const fileName = trimmedUrl.slice(legacyPrefix.length);
    if (!storedFileNameIsSafe(fileName)) return null;
    return {
      fileName,
      absolutePath: resolveInside(legacyStorageRootForBusiness(businessId), fileName)
    };
  }

  return null;
}

export async function POST(req: Request) {
  let logContext: { businessId?: string | null; userId?: string | null; size?: number | null; mime?: string | null } = {};

  try {
    if (req.method !== "POST") {
      await auditUploadBlocked({ request: req, reason: "method_not_allowed" });
      return NextResponse.json({ ok: false, error: "Metodo no permitido" }, { status: 405, headers: { Allow: "POST" } });
    }

    if (!requestHasAllowedOrigin(req)) {
      await auditUploadBlocked({ request: req, reason: "origin_not_allowed" });
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      await auditUploadBlocked({ request: req, reason: "invalid_form_data" });
      return invalidRequest();
    }

    const businessId = String(formData.get("businessId") || "").trim();
    if (!businessId) {
      await auditUploadBlocked({ request: req, reason: "missing_business_id" });
      return NextResponse.json({ ok: false, error: "Tienda obligatoria" }, { status: 400 });
    }
    logContext = { ...logContext, businessId };

    let access: Awaited<ReturnType<typeof getStoreAccess>>;
    try {
      access = await getStoreAccess({ request: req, businessId, permission: "manage_uploads", requireExplicitBusiness: true });
    } catch (error) {
      await auditUploadBlocked({
        request: req,
        reason: error instanceof AuthenticationError ? "authentication_required" : "authorization_failed"
      });
      return accessErrorResponse(error, "subir");
    }
    logContext = { ...logContext, businessId: access.business.id, userId: access.user.id };

    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: "upload:image:create", businessId: access.business.id, ip }),
        UPLOAD_RATE_LIMIT,
        UPLOAD_RATE_LIMIT_WINDOW_MS
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        await auditUploadBlocked({
          request: req,
          businessId: access.business.id,
          userId: access.user.id,
          reason: "rate_limited"
        });
        return NextResponse.json({ ok: false, error: "Demasiados intentos. Intenta nuevamente mas tarde.", retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    const fileEntries = formData.getAll("file");
    if (fileEntries.length !== MAX_FILES_PER_REQUEST) {
      await auditUploadBlocked({ request: req, businessId: access.business.id, userId: access.user.id, reason: "invalid_file_count" });
      return NextResponse.json({ ok: false, error: "Solo se permite una imagen por solicitud" }, { status: 400 });
    }

    const file = fileEntries[0];
    if (!(file instanceof File)) {
      await auditUploadBlocked({ request: req, businessId: access.business.id, userId: access.user.id, reason: "missing_file" });
      return NextResponse.json({ ok: false, error: "Archivo de imagen obligatorio" }, { status: 400 });
    }
    logContext = { ...logContext, size: file.size, mime: file.type };

    const declaredType = ALLOWED_TYPES.get(file.type.toLowerCase());
    if (!declaredType) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "mime_not_allowed",
        mime: file.type,
        size: file.size,
        extension: extensionFromFileName(file.name)
      });
      return NextResponse.json({ ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." }, { status: 400 });
    }

    if (!validateOriginalFileName(file.name)) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "invalid_file_name",
        mime: file.type,
        size: file.size,
        extension: extensionFromFileName(file.name)
      });
      return NextResponse.json({ ok: false, error: "Nombre de archivo invalido" }, { status: 400 });
    }

    const declaredFileExtension = extensionFromFileName(file.name);
    if (!declaredType.fileExtensions.includes(declaredFileExtension)) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "extension_mismatch",
        mime: file.type,
        size: file.size,
        extension: declaredFileExtension
      });
      return NextResponse.json({ ok: false, error: "La extension del archivo no coincide con JPG, PNG o WEBP." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "file_too_large",
        mime: file.type,
        size: file.size,
        extension: declaredFileExtension
      });
      return NextResponse.json({ ok: false, error: "La imagen supera el maximo de 5MB" }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedExtension = detectImageExtension(bytes);
    if (!detectedExtension || detectedExtension !== declaredType.canonicalExtension) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "magic_bytes_mismatch",
        mime: file.type,
        size: file.size,
        extension: declaredFileExtension
      });
      return NextResponse.json({ ok: false, error: "El archivo no coincide con un formato de imagen permitido" }, { status: 400 });
    }

    try {
      await requireMaxImages(access.business.id, await countStoredImages(access.business.id));
    } catch (error) {
      if (error instanceof PlanAccessError) {
        await auditUploadBlocked({
          request: req,
          businessId: access.business.id,
          userId: access.user.id,
          reason: "plan_limit",
          mime: file.type,
          size: file.size,
          extension: detectedExtension
        });
        return NextResponse.json({ ok: false, error: error.message }, { status: 402 });
      }
      throw error;
    }

    const uploadsRoot = storageRootForBusiness(access.business.id);
    await mkdir(uploadsRoot, { recursive: true });

    const uniqueName = `${crypto.randomUUID()}.${detectedExtension}`;
    const resolvedFile = resolveInside(uploadsRoot, uniqueName);
    if (!resolvedFile) {
      await auditUploadBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "invalid_storage_path",
        mime: file.type,
        size: file.size,
        extension: detectedExtension
      });
      return invalidRequest();
    }

    await writeFile(resolvedFile, bytes);
    const url = uploadUrlForBusiness(access.business.id, uniqueName);
    await auditSuccess({
      request: req,
      userId: access.user.id,
      businessId: access.business.id,
      action: "upload_image_success",
      entityType: "Upload",
      entityId: uniqueName,
      metadata: { fileName: uniqueName, mime: file.type, size: file.size, extension: detectedExtension }
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    logUploadError({ action: "create", ...logContext, error });
    return NextResponse.json({ ok: false, error: "No se pudo subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let logContext: { businessId?: string | null; userId?: string | null } = {};

  try {
    if (req.method !== "DELETE") {
      await auditDeleteBlocked({ request: req, reason: "method_not_allowed" });
      return NextResponse.json({ ok: false, error: "Metodo no permitido" }, { status: 405, headers: { Allow: "DELETE" } });
    }

    if (!requestHasAllowedOrigin(req)) {
      await auditDeleteBlocked({ request: req, reason: "origin_not_allowed" });
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { businessId?: unknown; url?: unknown } | null;
    if (!body || typeof body !== "object") {
      await auditDeleteBlocked({ request: req, reason: "invalid_json" });
      return invalidRequest();
    }

    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!businessId) {
      await auditDeleteBlocked({ request: req, reason: "missing_business_id" });
      return NextResponse.json({ ok: false, error: "Tienda obligatoria" }, { status: 400 });
    }
    if (!url) {
      await auditDeleteBlocked({ request: req, reason: "missing_url" });
      return NextResponse.json({ ok: false, error: "URL de imagen invalida" }, { status: 400 });
    }
    logContext = { ...logContext, businessId };

    let access: Awaited<ReturnType<typeof getStoreAccess>>;
    try {
      access = await getStoreAccess({ request: req, businessId, permission: "manage_uploads", requireExplicitBusiness: true });
    } catch (error) {
      await auditDeleteBlocked({
        request: req,
        reason: error instanceof AuthenticationError ? "authentication_required" : "authorization_failed"
      });
      return accessErrorResponse(error, "borrar");
    }
    logContext = { businessId: access.business.id, userId: access.user.id };

    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: "upload:image:delete", businessId: access.business.id, ip }),
        DELETE_RATE_LIMIT,
        DELETE_RATE_LIMIT_WINDOW_MS
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        await auditDeleteBlocked({
          request: req,
          businessId: access.business.id,
          userId: access.user.id,
          reason: "rate_limited"
        });
        return NextResponse.json({ ok: false, error: "Demasiados intentos. Intenta nuevamente mas tarde.", retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    if (!url.startsWith(`/uploads/businesses/${access.business.id}/images/`) && !url.startsWith(`/uploads/${access.business.id}/`)) {
      await auditDeleteBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "cross_tenant_or_invalid_prefix"
      });
      return NextResponse.json({ ok: false, error: "No autorizado para borrar esta imagen" }, { status: 403 });
    }

    const target = uploadTargetFromUrl(url, access.business.id);
    if (!target || !target.absolutePath) {
      await auditDeleteBlocked({
        request: req,
        businessId: access.business.id,
        userId: access.user.id,
        reason: "invalid_url"
      });
      return NextResponse.json({ ok: false, error: "URL de imagen invalida" }, { status: 400 });
    }

    await unlink(target.absolutePath).catch(() => undefined);
    await auditSuccess({
      request: req,
      userId: access.user.id,
      businessId: access.business.id,
      action: "delete_image_success",
      entityType: "Upload",
      entityId: target.fileName,
      metadata: { fileName: target.fileName }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logUploadError({ action: "delete", ...logContext, error });
    return NextResponse.json({ ok: false, error: "No se pudo borrar la imagen" }, { status: 500 });
  }
}
