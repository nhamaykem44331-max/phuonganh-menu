// src/app/(admin)/admin/login/page.tsx
// Admin Login — Email/Password form

import { LoginForm } from "@/components/admin/LoginForm";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChefHat } from "lucide-react";

export const metadata = { title: "Đăng nhập Admin" };

export default async function AdminLoginPage() {
  const session = await getAuthSession();
  if (session?.user) redirect("/admin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-jade via-jade-mid to-[#0d3326] flex items-center justify-center px-4">
      {/* Decorative rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full border border-white/5" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full border border-white/5" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <ChefHat size={28} className="text-white" />
          </div>
          <h1 className="font-display text-white text-2xl font-semibold">
            Phương Anh Admin
          </h1>
          <p className="text-white/60 text-sm mt-1">Quản lý nhà hàng & khách sạn</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl shadow-black/30">
          <h2 className="font-semibold text-ink text-lg mb-5">Đăng nhập</h2>
          <LoginForm />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Nhà hàng Phương Anh
        </p>
      </div>
    </div>
  );
}
