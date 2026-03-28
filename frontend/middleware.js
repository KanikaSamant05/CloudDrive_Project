import { NextResponse } from 'next/server';

export async function middleware(request) {
  const token    = request.cookies.get('access_token');
  const pathname = request.nextUrl.pathname;

  const isOnDrive = pathname.startsWith('/drive');
  const isOnAuth  = ['/login', '/register'].includes(pathname);
  const isOnShare = pathname.startsWith('/share');

  // Allow public share pages — no login needed
  if (isOnShare) {
    return NextResponse.next();
  }

  // Not logged in + trying to visit /drive → send to login
  if (!token && isOnDrive) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in + on login/register → send to /drive
  if (token && isOnAuth) {
    return NextResponse.redirect(new URL('/drive', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

