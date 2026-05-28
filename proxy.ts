import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "./lib/db";

export async function proxy(req: NextRequest) {
  const match = req.nextUrl.pathname.match(/^\/store\/([^/]+)(.*)$/);
  if (!match) return NextResponse.next();

  const slug = decodeURIComponent(match[1]);
  const tail = match[2] ?? "";

  // Validate slug format similarly to the API route.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return NextResponse.next();

  // Query DB directly instead of issuing an internal HTTP request. This
  // avoids making HTTPS requests to the public/tunneled hostname (which
  // can cause TLS errors when the local server is only HTTP).
  const history = await prisma.businessSlugHistory.findUnique({
    where: { slug },
    include: { business: { select: { publicSlug: true, isActive: true } } }
  });

  if (!history?.business?.isActive) return NextResponse.next();

  const redirectTo = history.business.publicSlug;
  if (!redirectTo || redirectTo === slug) return NextResponse.next();

  const target = req.nextUrl.clone();
  target.pathname = `/store/${redirectTo}${tail}`;
  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: ["/store/:path*"]
};
