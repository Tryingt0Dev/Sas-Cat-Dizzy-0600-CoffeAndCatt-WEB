import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return NextResponse.json({ redirectTo: null });
  }

  const history = await prisma.businessSlugHistory.findUnique({
    where: { slug },
    include: { business: { select: { publicSlug: true, isActive: true } } }
  });

  if (!history?.business.isActive) {
    return NextResponse.json({ redirectTo: null });
  }

  return NextResponse.json({ redirectTo: history.business.publicSlug });
}
