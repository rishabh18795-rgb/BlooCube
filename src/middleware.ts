import { NextResponse, type NextRequest } from 'next/server';

type Role = 'brand' | 'creator' | 'admin';

function getRole(req: NextRequest): Role | null {
  const userCookie = req.cookies.get('user_data')?.value;
  if (!userCookie) return null;
  try {
    const user = JSON.parse(userCookie) as { role?: Role };
    return user?.role || null;
  } catch {
    return null;
  }
}

// Edge-level route protection. This is a convenience redirect layer only —
// every protected API route also enforces auth/role server-side, since a
// cookie check here can't be the sole authorization boundary.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getRole(req);

  // The office-admin login is its own door, separate from the public one —
  // redirect an already-authenticated admin straight to the office
  // dashboard, same as /login does for its own roles.
  if (pathname === '/office-admin/login') {
    if (role === 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/office-admin/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === '/login' || pathname === '/signup') {
    if (role) {
      const url = req.nextUrl.clone();
      url.pathname = role === 'brand' ? '/brand' : role === 'admin' ? '/admin' : '/creator';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // /office-admin/* (other than /login, handled above) requires an admin
  // session and redirects to the office login specifically — never to the
  // public /login, which no longer accepts admin credentials at all.
  if (pathname === '/office-admin' || pathname.startsWith('/office-admin/')) {
    if (role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/office-admin/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const guardedPrefix = (['admin', 'creator', 'brand'] as const).find((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
  if (guardedPrefix) {
    if (!role) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (role !== guardedPrefix) {
      const url = req.nextUrl.clone();
      url.pathname = role === 'brand' ? '/brand' : role === 'admin' ? '/admin' : '/creator';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/admin/:path*', '/creator/:path*', '/brand/:path*', '/office-admin/:path*'],
  runtime: 'nodejs',
};
