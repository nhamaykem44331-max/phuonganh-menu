// src/middleware.ts
// Route protection — NextAuth withAuth + role-based access control

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Nếu không có token (chưa login) → withAuth tự redirect về signIn
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Route /admin chỉ cho ADMIN & MANAGER (trừ /admin/login & /admin/pos)
    const isAdminRoute =
      pathname.startsWith("/admin") &&
      !pathname.startsWith("/admin/login") &&
      !pathname.startsWith("/admin/pos");

    if (isAdminRoute) {
      const role = token.role as string;
      if (role !== "ADMIN" && role !== "MANAGER") {
        // Staff không được vào admin routes → redirect về POS
        return NextResponse.redirect(new URL("/admin/pos", req.url));
      }
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