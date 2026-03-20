// src/components/admin/SettingsClient.tsx
"use client";

import { useMemo, useState } from "react";

type SettingRecord = { key: string; value: string; group: string };

interface SettingsClientProps {
  initialSettings: SettingRecord[];
}

function toMap(settings: SettingRecord[]) {
  return settings.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const initialMap = useMemo(() => toMap(initialSettings), [initialSettings]);

  const [form, setForm] = useState({
    restaurant_name: initialMap.restaurant_name ?? "Nhà hàng Phương Anh",
    hotline: initialMap.hotline ?? "0839.881.881",
    address: initialMap.address ?? "Tân Lập 04, Phường Tích Lương, Thái Nguyên",
    opening_hours: initialMap.opening_hours ?? "10:00 - 22:30",
    order_tax_rate: initialMap.order_tax_rate ?? "0",
    service_fee_rate: initialMap.service_fee_rate ?? "0",
    order_auto_confirm: initialMap.order_auto_confirm ?? "false",
    enable_order_webhook: initialMap.enable_order_webhook ?? "true",
    enable_banquet_reminder: initialMap.enable_banquet_reminder ?? "true",
    daily_report_email: initialMap.daily_report_email ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      settings: [
        { key: "restaurant_name", value: form.restaurant_name, group: "general" },
        { key: "hotline", value: form.hotline, group: "general" },
        { key: "address", value: form.address, group: "general" },
        { key: "opening_hours", value: form.opening_hours, group: "general" },
        { key: "order_tax_rate", value: form.order_tax_rate, group: "payment" },
        { key: "service_fee_rate", value: form.service_fee_rate, group: "payment" },
        { key: "order_auto_confirm", value: form.order_auto_confirm, group: "orders" },
        { key: "enable_order_webhook", value: form.enable_order_webhook, group: "notification" },
        { key: "enable_banquet_reminder", value: form.enable_banquet_reminder, group: "notification" },
        { key: "daily_report_email", value: form.daily_report_email, group: "notification" },
      ],
    };

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Không thể lưu cài đặt");
      }

      setMessage("Đã lưu cài đặt thành công.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            error ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Thông tin nhà hàng</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Tên nhà hàng
            <input
              value={form.restaurant_name}
              onChange={(e) => updateField("restaurant_name", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>

          <label className="text-sm text-slate-700">
            Hotline
            <input
              value={form.hotline}
              onChange={(e) => updateField("hotline", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>

          <label className="text-sm text-slate-700 md:col-span-2">
            Địa chỉ
            <input
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>

          <label className="text-sm text-slate-700">
            Giờ mở cửa
            <input
              value={form.opening_hours}
              onChange={(e) => updateField("opening_hours", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>
        </div>
      </section>

      <section className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Đơn hàng & thanh toán</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Thuế mặc định (%)
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.order_tax_rate}
              onChange={(e) => updateField("order_tax_rate", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>

          <label className="text-sm text-slate-700">
            Phí dịch vụ (%)
            <input
              type="number"
              min={0}
              step="0.1"
              value={form.service_fee_rate}
              onChange={(e) => updateField("service_fee_rate", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            />
          </label>

          <label className="text-sm text-slate-700">
            Tự động xác nhận đơn
            <select
              value={form.order_auto_confirm}
              onChange={(e) => updateField("order_auto_confirm", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            >
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white border border-[var(--admin-border)] rounded-xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Thông báo & tích hợp</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm text-slate-700">
            Bật webhook đơn hàng
            <select
              value={form.enable_order_webhook}
              onChange={(e) => updateField("enable_order_webhook", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            >
              <option value="true">Bật</option>
              <option value="false">Tắt</option>
            </select>
          </label>

          <label className="text-sm text-slate-700">
            Bật nhắc tiệc
            <select
              value={form.enable_banquet_reminder}
              onChange={(e) => updateField("enable_banquet_reminder", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            >
              <option value="true">Bật</option>
              <option value="false">Tắt</option>
            </select>
          </label>

          <label className="text-sm text-slate-700 md:col-span-2">
            Email nhận báo cáo ngày
            <input
              type="email"
              value={form.daily_report_email}
              onChange={(e) => updateField("daily_report_email", e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
              placeholder="manager@phuonganh.vn"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[var(--admin-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}
