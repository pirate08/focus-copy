import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/signup"];

  // API auth paths that don't require authentication
  const authApiPaths = ["/api/auth/signup", "/api/auth/login"];

  // Check if the path is public or auth API
  const isPublicPath = publicPaths.some((path) => pathname === path);
  const isAuthApi = authApiPaths.some((path) => pathname.startsWith(path));

  // Allow public pages and auth APIs
  if (isPublicPath || isAuthApi) {
    return NextResponse.next();
  }

  // Check for session cookie on protected routes
  const sessionCookie = request.cookies.get("session");
  if (!sessionCookie) {
    // Redirect to login if trying to access protected route
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (auth routes are handled separately in middleware logic)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
};
