import { NextResponse } from 'next/server';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  const isOnShare = pathname.startsWith('/share');
  const isOnAuth  = ['/login', '/register'].includes(pathname);

  // Allow public share pages — no login needed
  if (isOnShare) {
    return NextResponse.next();
  }

  // Allow auth pages
  if (isOnAuth) {
    return NextResponse.next();
  }

  // Allow everything else — pages handle their own auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};