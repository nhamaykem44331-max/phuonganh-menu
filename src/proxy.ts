// src/proxy.ts
// Route protection with role-based redirect

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    if (!pathname.startsWith("/admin") || pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    const role = token.role as string;

    if (role === "STAFF") {
      const isPosRoute = pathname === "/admin/pos" || pathname.startsWith("/admin/pos/");
      if (!isPosRoute) {
        return NextResponse.redirect(new URL("/admin/pos", req.url));
      }
      return NextResponse.next();
    }

    if (role !== "ADMIN" && role !== "MANAGER") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/admin/login",
    },
  }
);

export const config = {
  matcher: ["/admin/((?!login).*)"],
};
