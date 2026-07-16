import { NextRequest, NextResponse } from 'next/server';
import { dashboardPathForRole } from '@/lib/roles';

const PROTECTED_PREFIX = '/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('disha_refresh_token')?.value;
  const role = request.cookies.get('disha_role')?.value;

  if (pathname.startsWith(PROTECTED_PREFIX) && !refreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && refreshToken && role) {
    return NextResponse.redirect(new URL(dashboardPathForRole(role), request.url));
  }

  if (pathname === PROTECTED_PREFIX && role) {
    return NextResponse.redirect(new URL(dashboardPathForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
