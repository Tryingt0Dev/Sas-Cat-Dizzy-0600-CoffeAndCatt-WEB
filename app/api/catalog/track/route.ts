import { NextResponse } from "next/server";
import { z } from "zod";
import { ProductStatus } from "@/lib/enums";
import { assertRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";

const trackEventSchema = z.object({
  businessSlug: z.string().trim().min(1).max(120),
  productId: z.string().trim().min(1),
  event: z.enum(["product_view", "whatsapp_click"])
});

export async function POST(req: Request) {
  try {
    const payload = trackEventSchema.safeParse(await req.json());
    if (!payload.success) {
      return NextResponse.json({ ok: false, error: "Evento invalido" }, { status: 400 });
    }

    const ip = await getClientIp();
    try {
      assertRateLimit(`catalog-track:${payload.data.businessSlug}:${ip}`, 180, 15 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: "Demasiados eventos. Intenta nuevamente mas tarde." }, { status: 429 });
      }
      throw error;
    }

    const business = await prisma.business.findFirst({
      where: { slug: payload.data.businessSlug, isActive: true },
      select: { id: true }
    });

    if (!business) {
      return NextResponse.json({ ok: false, error: "Tienda no encontrada" }, { status: 404 });
    }

    const data =
      payload.data.event === "product_view"
        ? { productViewCount: { increment: 1 } }
        : { whatsappClickCount: { increment: 1 } };

    const result = await prisma.product.updateMany({
      where: {
        id: payload.data.productId,
        businessId: business.id,
        status: ProductStatus.ACTIVE
      },
      data
    });

    if (result.count === 0) {
      return NextResponse.json({ ok: false, error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar el evento" }, { status: 500 });
  }
}
