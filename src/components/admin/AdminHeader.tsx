// src/components/admin/AdminHeader.tsx
"use client";

import { usePathname } from "next/navigation";
import { User, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export function AdminHeader({ user }: { user: { name?: string | null; email?: string | null; role: string } }) {
  const pathname = usePathname();
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) +
          " - " +
          now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      );
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const isLast = i === segments.length - 1;
    let label = seg.charAt(0).toUpperCase() + seg.slice(1);

    if (seg === "admin") label = "Admin";
    if (seg === "menu") label = "Thực đơn";
    if (seg === "categories") label = "Danh mục";
    if (seg === "orders") label = "Đơn hàng";
    if (seg === "banquets") label = "Tiệc";
    if (seg === "customers") label = "Khách hàng";
    if (seg === "reports") label = "Báo cáo";
    if (seg === "settings") label = "Cài đặt";
    if (seg === "pos") label = "POS";

    return (
      <div key={`${seg}-${i}`} className="flex items-center gap-1.5">
        <span className={isLast ? "text-slate-800 font-semibold" : "text-slate-500"}>{label}</span>
        {!isLast && <ChevronRight size={14} className="text-slate-400" />}
      </div>
    );
  });

  let pageTitle = "Dashboard";
  if (pathname.includes("/menu/categories")) pageTitle = "Quản lý danh mục";
  else if (pathname.includes("/menu")) pageTitle = "Quản lý thực đơn";
  else if (pathname.includes("/orders")) pageTitle = "Quản lý đơn hàng";
  else if (pathname.includes("/banquets")) pageTitle = "Quản lý tiệc";
  else if (pathname.includes("/customers")) pageTitle = "Khách hàng";
  else if (pathname.includes("/reports")) pageTitle = "Báo cáo doanh thu";
  else if (pathname.includes("/settings")) pageTitle = "Cài đặt hệ thống";
  else if (pathname.includes("/pos")) pageTitle = "Điểm bán hàng (POS)";

  const roleLabel =
    user.role === "ADMIN" ? "Quản trị viên" : user.role === "MANAGER" ? "Quản lý" : "Nhân viên";

  return (
    <header className="h-[80px] bg-[var(--admin-card)] border-b border-[var(--admin-border)] flex flex-col justify-center px-8 shrink-0 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium mb-1.5 font-ui">{breadcrumbs}</div>
          <h1 className="font-display font-bold text-[28px] leading-none text-slate-900 tracking-wide">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-[var(--admin-primary)] font-ui">{dateStr}</p>
          </div>
          <div className="h-8 w-px bg-[var(--admin-border)] hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block font-ui">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name || user.email}</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{roleLabel}</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
              <User size={18} className="text-slate-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
