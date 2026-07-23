import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const publicRoutes = ["/login", "/verify", "/api/auth/login", "/api/auth/register", "/api/auth/verify-otp"];
const clientPublicRoutes = ["/client/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // --- SUBDOMAIN ROUTING ---
  // Extract subdomain: "legacy-memorial.leadgen-pipeline.vercel.app" -> "legacy-memorial"
  const baseDomain = process.env.VERCEL_URL || "leadgen-pipeline-mauve.vercel.app";
  const subdomain = hostname.replace(`.${baseDomain}`, "").replace(baseDomain, "");

  if (subdomain && subdomain.length > 0 && !subdomain.includes(".") && subdomain !== "www" && subdomain !== "api") {
    // Rewrite /subdomain-path to /client/{subdomain}
    const url = req.nextUrl.clone();
    url.pathname = `/client/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Allow public routes (admin auth)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow client dashboard routes (they handle their own auth)
  if (clientPublicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow API routes for client auth
  if (pathname.startsWith("/api/client-auth")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check auth token for admin routes
  const token = req.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set("auth-token", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.userId.toString());
  requestHeaders.set("x-user-email", payload.email);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
