// src/lib/auth.ts
// NextAuth.js Configuration - Phân quyền Admin / Manager / Staff

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

// =============================================
// VALIDATE REQUIRED ENV VARS (S4)
// =============================================
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "❌ NEXTAUTH_SECRET is not set. Please add it to your .env file.\n" +
    "Generate one with: openssl rand -base64 32"
  );
}

// =============================================
// NEXTAUTH CONFIG
// =============================================

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },

  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },

  providers: [
    // Email + Password (cho Admin/Manager)
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email và mật khẩu không được để trống");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          throw new Error("Tài khoản không tồn tại hoặc đã bị khóa");
        }

        const isValidPassword = await compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("Mật khẩu không chính xác");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),

    // PIN Login (cho Staff order tại bàn)
    CredentialsProvider({
      id: "pin",
      name: "PIN Nhân viên",
      credentials: {
        pin: { label: "Mã PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.pin) {
          throw new Error("Vui lòng nhập mã PIN");
        }

        const user = await prisma.user.findFirst({
          where: {
            pin: credentials.pin,
            isActive: true,
          },
        });

        if (!user) {
          throw new Error("Mã PIN không đúng hoặc tài khoản đã bị khóa");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { id: string; role: UserRole }).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// =============================================
// HELPER FUNCTIONS
// =============================================

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

/** Kiểm tra quyền Admin hoặc Manager */
export async function requireAdmin() {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  if (
    session.user.role !== UserRole.ADMIN &&
    session.user.role !== UserRole.MANAGER
  ) {
    throw new Error("Forbidden: Cần quyền Admin hoặc Manager");
  }

  return session;
}

/** Kiểm tra quyền tối thiểu Staff */
export async function requireAuth() {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}
