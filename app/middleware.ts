import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const hostname = host.replace(/:\d+$/, '');

  // Parse subdomain as tenant slug: slug.myapp.com
  const parts = hostname.split('.');
  const res = NextResponse.next();
  if (parts.length >= 3) {
    const slug = parts[0];
    res.headers.set('x-tenant-slug', slug);
  }

  // Enforce authentication for protected UI routes early in the edge layer.
  const pathname = req.nextUrl.pathname;
  const session = req.cookies.get('catg_session')?.value;

  // If user is not authenticated, redirect to login for admin and dashboard routes.
  if (!session && (pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || pathname.startsWith('/settings'))) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'Necesitas iniciar sesión');
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/store/:path*', '/api/:path*', '/admin/:path*', '/dashboard/:path*', '/settings/:path*']
};
