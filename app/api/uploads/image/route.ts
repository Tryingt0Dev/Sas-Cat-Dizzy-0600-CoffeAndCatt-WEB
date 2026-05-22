import crypto from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo de imagen obligatorio" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) {
      return NextResponse.json({ ok: false, error: "Formato no permitido. Usa JPG, PNG o WEBP." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: "La imagen supera el maximo de 5MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const uploadsRoot = path.join(process.cwd(), "public", "uploads", business.id);
    await mkdir(uploadsRoot, { recursive: true });

    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${sanitizeBaseName(file.name)}.${extension}`;
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

    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    const url = body?.url || "";
    const business = await prisma.business.findFirst({
      where: { ownerId: user.id },
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
