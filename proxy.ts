import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const match = req.nextUrl.pathname.match(/^\/store\/([^/]+)(.*)$/);
  if (!match) return NextResponse.next();

  const slug = decodeURIComponent(match[1]);
  const tail = match[2] ?? "";
  const checkUrl = new URL("/api/store-slug-redirect", req.url);
  checkUrl.searchParams.set("slug", slug);

  const res = await fetch(checkUrl);
  if (!res.ok) return NextResponse.next();

  const payload = (await res.json().catch(() => null)) as { redirectTo?: string | null } | null;
  if (!payload?.redirectTo || payload.redirectTo === slug) return NextResponse.next();

  const target = req.nextUrl.clone();
  target.pathname = `/store/${payload.redirectTo}${tail}`;
  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: ["/store/:path*"]
};
