import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Manager-only routes
    if (pathname.startsWith('/manager') && role !== 'manager') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // POS is public, manager requires login
        if (pathname.startsWith('/pos')) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/pos/:path*', '/manager/:path*'],
};
