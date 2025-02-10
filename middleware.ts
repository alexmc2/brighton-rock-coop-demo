// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  const providedKey = nextUrl.searchParams.get('key');

  // Only run for /members routes, skip everything else

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Attempt to get the session (and silently refresh token if needed)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Create a mutable response that we can modify with headers
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Add cache control headers for all authenticated requests
  if (session) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // Allow public access to the calendar ICS feed if the secret key is provided
  if (pathname === '/members/api/calendar') {
    if (providedKey === process.env.SECRET_CALENDAR_KEY) {
      // If the secret key matches, skip session check and allow access
      return response;
    } else if (!session) {
      // If no valid key and no session, redirect to login
      return NextResponse.redirect(new URL('/members/login', request.url));
    }
  }

  // If user has no session and is heading to a protected route, redirect to login:
  if (
    !session &&
    pathname !== '/members/login' &&
    pathname !== '/members/signup' &&
    pathname !== '/members/reset-password'
  ) {
    const redirectUrl = new URL('/members/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user *does* have a session and is on the login page, go to dashboard:
  if (
    session &&
    (pathname === '/members/login' ||
      pathname === '/members/signup' ||
      pathname === '/members/reset-password')
  ) {
    return NextResponse.redirect(new URL('/members/dashboard', request.url));
  }

  return response;
}

// Restrict the middleware to /members/... only
export const config = {
  matcher: ['/members/:path*', '/api/members/:path*', '/api/auth/:path*'],
};
