import crypto from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { writeAuditLog } from "@/services/audit-log";
import { AuthenticationError, AuthorizationError, getStoreAccess } from "@/services/authorization";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", { canonicalExtension: "jpg", fileExtensions: ["jpg", "jpeg"] }],
  ["image/png", { canonicalExtension: "png", fileExtensions: ["png"] }],
  ["image/webp", { canonicalExtension: "webp", fileExtensions: ["webp"] }]
]);

// Local development storage. Swap this route implementation for Supabase Storage,
// S3, Cloudinary or UploadThing without changing ImageDropzone consumers.

function sanitizeBaseName(name: string) {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  const safe = withoutExtension
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
  return safe || "imagen";
}

function businessIdFromUploadUrl(url: string) {
  const parts = url.split("/").filter(Boolean);
  if (parts.length < 3 || parts[0] !== "uploads") return null;
  return parts[1];
}

function extensionFromFileName(name: string) {
  return path.extname(name).replace(".", "").toLowerCase();
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

function accessErrorResponse(error: unknown) {
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ ok: false, error: "No autorizado para subir imagenes" }, { status: 401 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ ok: false, error: "No autorizado para subir imagenes" }, { status: 403 });
  }
  throw error;
}

export async function POST(req: Request) {
  try {
    if (!requestHasAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }
    const formData = await req.formData();
    const businessId = String(formData.get("businessId") || "").trim();
    if (!businessId) {
      return NextResponse.json({ ok: false, error: "Tienda obligatoria" }, { status: 400 });
    }

    let access: Awaited<ReturnType<typeof getStoreAccess>>;
    try {
      access = await getStoreAccess({ request: req, businessId, permission: "manage_uploads" });
    } catch (error) {
      return accessErrorResponse(error);
    }
    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: "upload:image:create", businessId: access.business.id, userId: access.user.id, ip }),
        60,
        15 * 60 * 1000
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo de imagen obligatorio" }, { status: 400 });
    }

    const declaredType = ALLOWED_TYPES.get(file.type.toLowerCase());
    if (!declaredType) {
      return NextResponse.json({ ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." }, { status: 400 });
    }

    const declaredFileExtension = extensionFromFileName(file.name);
    if (!declaredType.fileExtensions.includes(declaredFileExtension)) {
      return NextResponse.json({ ok: false, error: "La extension del archivo no coincide con JPG, PNG o WEBP." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: "La imagen supera el maximo de 5MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedExtension = detectImageExtension(bytes);
    if (!detectedExtension || detectedExtension !== declaredType.canonicalExtension) {
      return NextResponse.json({ ok: false, error: "El archivo no coincide con un formato de imagen permitido" }, { status: 400 });
    }

    const uploadsRoot = path.join(process.cwd(), "public", "uploads", access.business.id);
    await mkdir(uploadsRoot, { recursive: true });

    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizeBaseName(file.name)}.${detectedExtension}`;
    const absolutePath = path.join(uploadsRoot, uniqueName);
    const resolvedRoot = path.resolve(uploadsRoot);
    const resolvedFile = path.resolve(absolutePath);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
      return NextResponse.json({ ok: false, error: "Ruta de archivo invalida" }, { status: 400 });
    }

    await writeFile(resolvedFile, bytes);
    const url = `/uploads/${access.business.id}/${uniqueName}`;
    await writeAuditLog({
      userId: access.user.id,
      businessId: access.business.id,
      action: "upload.image.create",
      resourceType: "Upload",
      resourceId: uniqueName,
      metadata: { url, mimeType: file.type, size: file.size }
    });
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!requestHasAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url || "";
    const uploadBusinessId = businessIdFromUploadUrl(url);
    if (!uploadBusinessId) {
      return NextResponse.json({ ok: false, error: "URL de imagen invalida" }, { status: 400 });
    }

    let access: Awaited<ReturnType<typeof getStoreAccess>>;
    try {
      access = await getStoreAccess({ request: req, businessId: uploadBusinessId, permission: "manage_uploads" });
    } catch (error) {
      return accessErrorResponse(error);
    }
    const ip = await getClientIp(req);
    try {
      await assertRateLimit(
        rateLimitKey({ endpoint: "upload:image:delete", businessId: access.business.id, userId: access.user.id, ip }),
        120,
        15 * 60 * 1000
      );
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }
    if (!url.startsWith(`/uploads/${access.business.id}/`)) {
      return NextResponse.json({ ok: false, error: "No autorizado para borrar esta imagen" }, { status: 403 });
    }

    const fileName = path.basename(url);
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads", access.business.id);
    const absolutePath = path.resolve(uploadsRoot, fileName);
    if (!absolutePath.startsWith(uploadsRoot + path.sep)) {
      return NextResponse.json({ ok: false, error: "Ruta de archivo invalida" }, { status: 400 });
    }

    await unlink(absolutePath).catch(() => undefined);
    await writeAuditLog({
      userId: access.user.id,
      businessId: access.business.id,
      action: "upload.image.delete",
      resourceType: "Upload",
      resourceId: fileName,
      metadata: { url }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo borrar la imagen" }, { status: 500 });
  }
}
