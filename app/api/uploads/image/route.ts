import crypto from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
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

async function resolveUploadBusiness(formDataBusinessId?: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.business.findFirst({
    where: {
      ownerId: user.id,
      ...(formDataBusinessId ? { id: formDataBusinessId } : {})
    },
    select: { id: true, ownerId: true }
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const businessId = String(formData.get("businessId") || "").trim();
    const business = await resolveUploadBusiness(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "No autorizado para subir imagenes" }, { status: 401 });
    }
    const ip = await getClientIp();
    try {
      assertRateLimit(`upload:${business.id}:${ip}`, 60, 15 * 60 * 1000);
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

    const declaredExtension = ALLOWED_TYPES.get(file.type);
    if (!declaredExtension) {
      return NextResponse.json({ ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: "La imagen supera el maximo de 5MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedExtension = detectImageExtension(bytes);
    if (!detectedExtension || detectedExtension !== declaredExtension) {
      return NextResponse.json({ ok: false, error: "El archivo no coincide con un formato de imagen permitido" }, { status: 400 });
    }

    const uploadsRoot = path.join(process.cwd(), "public", "uploads", business.id);
    await mkdir(uploadsRoot, { recursive: true });

    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizeBaseName(file.name)}.${detectedExtension}`;
    const absolutePath = path.join(uploadsRoot, uniqueName);
    const resolvedRoot = path.resolve(uploadsRoot);
    const resolvedFile = path.resolve(absolutePath);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
      return NextResponse.json({ ok: false, error: "Ruta de archivo invalida" }, { status: 400 });
    }

    await writeFile(resolvedFile, bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${business.id}/${uniqueName}` });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo subir la imagen" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autorizado para borrar imagenes" }, { status: 401 });
    }
    const ip = await getClientIp();
    try {
      assertRateLimit(`upload-delete:${user.id}:${ip}`, 120, 15 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url || "";
    const uploadBusinessId = businessIdFromUploadUrl(url);
    if (!uploadBusinessId) {
      return NextResponse.json({ ok: false, error: "URL de imagen invalida" }, { status: 400 });
    }

    const business = await prisma.business.findFirst({
      where: { id: uploadBusinessId, ownerId: user.id },
      select: { id: true }
    });
    if (!business || !url.startsWith(`/uploads/${business.id}/`)) {
      return NextResponse.json({ ok: false, error: "No autorizado para borrar esta imagen" }, { status: 403 });
    }

    const fileName = path.basename(url);
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads", business.id);
    const absolutePath = path.resolve(uploadsRoot, fileName);
    if (!absolutePath.startsWith(uploadsRoot + path.sep)) {
      return NextResponse.json({ ok: false, error: "Ruta de archivo invalida" }, { status: 400 });
    }

    await unlink(absolutePath).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo borrar la imagen" }, { status: 500 });
  }
}
