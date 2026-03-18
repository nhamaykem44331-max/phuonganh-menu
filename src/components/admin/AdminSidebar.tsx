// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  BarChart3, Settings, LogOut, ChefHat,
  CalendarCheck, Users, Tag,
} from "lucide-react";

interface AdminSidebarProps {
  user: { name?: string | null; email?: string | null; role: string };
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/menu", icon: UtensilsCrossed, label: "Thực đơn" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Đơn hàng" },
  { href: "/admin/banquets", icon: CalendarCheck, label: "Tiệc & Sự kiện" },
  { href: "/admin/customers", icon: Users, label: "Khách hàng" },
  { href: "/admin/reports", icon: BarChart3, label: "Báo cáo" },
  { href: "/admin/settings", icon: Settings, label: "Cài đặt" },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-jade rounded-xl flex items-center justify-center">
            <ChefHat size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-jade text-sm leading-tight">
              Phương Anh
            </p>
            <p className="text-[10px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`admin-nav-link flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all ${
                active
                  ? "active bg-jade-light text-jade font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} className={active ? "text-jade" : "text-gray-400"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-semibold text-ink truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {user.role === "ADMIN" ? "Quản trị viên" : "Quản lý"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
