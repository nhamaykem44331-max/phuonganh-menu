// src/components/admin/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock, KeyRound } from "lucide-react";

type LoginMode = "credentials" | "pin";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("credentials");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", pin: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result =
        mode === "credentials"
          ? await signIn("credentials", {
              email: form.email,
              password: form.password,
              redirect: false,
            })
          : await signIn("pin", {
              pin: form.pin,
              redirect: false,
            });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Thông tin đăng nhập không đúng" : result.error);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role as string | undefined;

        const nextRoute = role === "STAFF" ? "/admin/pos" : "/admin";
        router.push(nextRoute);
        router.refresh();
      }
    } catch {
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMode("credentials")}
          className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
            mode === "credentials" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Admin/Manager
        </button>
        <button
          type="button"
          onClick={() => setMode("pin")}
          className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
            mode === "pin" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
          }`}
        >
          Staff PIN
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {mode === "credentials" ? (
        <>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="admin@phuonganh.vn"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Mật khẩu</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-10 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Mã PIN nhân viên</label>
          <div className="relative">
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
              placeholder="Nhập mã PIN"
              required
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 focus:border-jade transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Dùng cho nhân viên tạo đơn nhanh tại quầy.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-jade hover:bg-jade-mid disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] mt-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground pt-1">Quên thông tin đăng nhập? Liên hệ quản trị viên</p>
    </form>
  );
}
