// // middleware.ts

// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';

// export async function middleware(request: NextRequest) {
//   const res = NextResponse.next();
//   const supabase = createMiddlewareClient({ req: request, res });
//   const {
//     data: { session },
//   } = await supabase.auth.getSession();

//   const path = request.nextUrl.pathname;
//   const providedKey = request.nextUrl.searchParams.get('key');

//   // Allow public access to the calendar ICS feed if the secret key is provided
//   if (path === '/members/api/calendar') {
//     if (providedKey === process.env.SECRET_CALENDAR_KEY) {
//       // If the secret key matches, skip session check and allow access
//       return res;
//     } else if (!session) {
//       // If no valid key and no session, redirect to login
//       return NextResponse.redirect(new URL('/members/login', request.url));
//     }
//   }

//   // Allow public access to main site routes (outside /members)
//   if (!path.startsWith('/members')) {
//     return res;
//   }

//   // Allow access to login-related routes even when not logged in
//   if (
//     path === '/members/login' ||
//     path === '/members/signup' ||
//     path === '/members/reset-password'
//   ) {
//     if (session) {
//       return NextResponse.redirect(new URL('/members/dashboard', request.url));
//     }
//     return res;
//   }

//   // For all other /members routes, require authentication
//   if (!session) {
//     const redirectUrl = new URL('/members/login', request.url);
//     redirectUrl.searchParams.set('redirectedFrom', path);
//     return NextResponse.redirect(redirectUrl);
//   }

//   return res;
// }

// // Specify which routes this middleware should run on
// export const config = {
//   matcher: ['/(.*)'],
// };

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  const providedKey = nextUrl.searchParams.get('key');

  // Only run for /members routes, skip everything else

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Attempt to get the session (and silently refresh token if needed)
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
  matcher: ['/members/:path*'],
};
