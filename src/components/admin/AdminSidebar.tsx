// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  BarChart3, Settings, LogOut, ChefHat,
  CalendarCheck, Users, Tag, ChevronLeft, ChevronRight
} from "lucide-react";

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null; role: string };
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/menu", icon: UtensilsCrossed, label: "Thực đơn", exact: true },
  { href: "/admin/menu/categories", icon: Tag, label: "Danh mục" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Đơn hàng" },
  { href: "/admin/banquets", icon: CalendarCheck, label: "Tiệc & Sự kiện" },
  { href: "/admin/customers", icon: Users, label: "Khách hàng" },
  { href: "/admin/reports", icon: BarChart3, label: "Báo cáo" },
  { href: "/admin/settings", icon: Settings, label: "Cài đặt" },
];

import { useState } from "react";

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className={`${isCollapsed ? "w-[80px]" : "w-[240px]"} transition-all duration-300 bg-[var(--admin-sidebar)] border-r border-white/5 flex flex-col h-full shadow-xl z-20 shrink-0 relative`}>
      {/* Logo */}
      <div className={`px-6 py-6 border-b border-white/5 ${isCollapsed ? "flex justify-center px-0" : ""}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-9 h-9 shrink-0 bg-[var(--admin-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--admin-primary)]/20">
            <ChefHat size={18} className="text-white relative top-[-1px]" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <p className="font-display font-bold text-white text-[15px] leading-tight tracking-wider uppercase">
                Phương Anh
              </p>
              <p className="text-[10px] text-[var(--admin-sidebar-text)] uppercase font-semibold tracking-[0.15em] mt-0.5">
                RMS Portal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-6 px-4 space-y-1.5 overflow-y-auto scrollbar-thin ${isCollapsed ? "px-2" : ""}`}>
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-3 py-3 text-[13px] rounded-xl transition-all font-ui ${isCollapsed ? "justify-center px-0" : "px-4"} ${
                active
                  ? "bg-[var(--admin-sidebar-active)] text-white shadow-md shadow-[var(--admin-primary)]/20 font-semibold"
                  : "text-[var(--admin-sidebar-text)] hover:bg-white/5 hover:text-white font-medium"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} className={active ? "text-white shrink-0" : "opacity-80 shrink-0"} />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle & Logout */}
      <div className="px-4 py-4 border-t border-white/5 flex flex-col gap-2 relative">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center justify-center w-full py-2 hover:bg-white/5 rounded-xl transition-colors text-[var(--admin-sidebar-text)] hover:text-white ${!isCollapsed ? "justify-end pr-4 text-xs" : ""}`}
          title={isCollapsed ? "Mở rộng cột chức năng" : "Thu gọn cột chức năng"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><span className="opacity-70">Thu gọn</span> <ChevronLeft size={16} /></div>}
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          title={isCollapsed ? "Đăng xuất tài khoản" : undefined}
          className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all font-ui border border-transparent hover:border-red-400/20 ${!isCollapsed ? "px-4" : "px-0"}`}
        >
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Đăng xuất tài khoản</span>}
        </button>
      </div>
    </aside>
  );
}
