// src/app/(admin)/admin/settings/page.tsx
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/admin/SettingsClient";

export const metadata = { title: "Cài đặt" };

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm">
        <h1 className="font-display text-2xl text-slate-900">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý thông tin nhà hàng, quy tắc đơn hàng, webhook và thông báo nội bộ.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
