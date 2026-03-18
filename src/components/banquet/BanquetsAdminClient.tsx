// src/components/banquet/BanquetsAdminClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, List, ChevronLeft, ChevronRight,
  Phone, Users, MapPin, Clock, CheckCircle2,
  AlertCircle, TrendingUp, FileText, Bell,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Banquet {
  id: string;
  eventType: string;
  eventDate: string;
  guestCount: number;
  status: string;
  pricePerPerson: number | null;
  totalPrice: number | null;
  depositAmount: number | null;
  note: string | null;
  followUpDate: string | null;
  customer: { name: string; phone: string } | null;
  room: { name: string } | null;
}

interface BanquetsAdminClientProps {
  banquets: Banquet[];
  upcoming: Banquet[];
  monthStats: { total: number; revenue: number; byStatus: Record<string, number> };
  currentMonth: string;
  currentStatus: string;
  view: "list" | "calendar";
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  INQUIRY:   { label: "Hỏi thông tin", color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  QUOTED:    { label: "Đã báo giá",    color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  CONFIRMED: { label: "Đã xác nhận",  color: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  DEPOSITED: { label: "Đã đặt cọc",   color: "bg-teal-100 text-teal-700",     dot: "bg-teal-500" },
  COMPLETED: { label: "Hoàn thành",   color: "bg-gray-100 text-gray-600",     dot: "bg-gray-400" },
  CANCELLED: { label: "Đã hủy",       color: "bg-red-100 text-red-500",       dot: "bg-red-400" },
};

const STATUS_FLOW: Record<string, string> = {
  INQUIRY: "QUOTED",
  QUOTED: "CONFIRMED",
  CONFIRMED: "DEPOSITED",
  DEPOSITED: "COMPLETED",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  ...Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label })),
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
  });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

// ─── Banquet Detail Modal ─────────────────────────────────────────────────────
function BanquetDetailModal({
  banquet,
  onClose,
  onUpdated,
}: {
  banquet: Banquet;
  onClose: () => void;
  onUpdated: (updated: Banquet) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [editPrice, setEditPrice] = useState(String(banquet.pricePerPerson ?? ""));
  const [editDeposit, setEditDeposit] = useState(String(banquet.depositAmount ?? ""));
  const [editNote, setEditNote] = useState(banquet.note ?? "");

  const cfg = STATUS_CONFIG[banquet.status];
  const nextStatus = STATUS_FLOW[banquet.status];

  const saveUpdate = async (patch: Partial<Banquet>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/banquets/${banquet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (res.ok) onUpdated(json.data);
    } catch {
      alert("Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = () => saveUpdate({ status: nextStatus as never });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-ink">{banquet.eventType}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(banquet.eventDate)} lúc {formatTime(banquet.eventDate)}
              </p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg?.color}`}>
              {cfg?.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Key info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: "Số khách", value: `${banquet.guestCount} người` },
              { icon: MapPin, label: "Phòng", value: banquet.room?.name ?? "Chưa chọn" },
              { icon: Phone, label: "Khách", value: banquet.customer?.name ?? "—" },
              { icon: Phone, label: "SĐT", value: banquet.customer?.phone ?? "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Icon size={12} />
                  {label}
                </div>
                <p className="font-semibold text-sm text-ink">{value}</p>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-ink">Báo giá</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Giá/người (đ)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                  placeholder="800000"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Đặt cọc (đ)</label>
                <input
                  type="number"
                  value={editDeposit}
                  onChange={(e) => setEditDeposit(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                  placeholder="5000000"
                />
              </div>
            </div>

            {editPrice && (
              <div className="bg-jade-light rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-jade">Tổng ước tính ({banquet.guestCount} khách)</span>
                <span className="font-bold text-jade price-tag">
                  {formatPrice(Number(editPrice) * banquet.guestCount)}
                </span>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Ghi chú</label>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 resize-none"
              placeholder="Yêu cầu đặc biệt, trang trí, menu..."
            />
          </div>

          {/* Save changes */}
          <button
            onClick={() => saveUpdate({
              pricePerPerson: editPrice ? Number(editPrice) : null,
              depositAmount: editDeposit ? Number(editDeposit) : null,
              note: editNote,
            })}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-ink rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>

          {/* Advance status */}
          {nextStatus && (
            <button
              onClick={advanceStatus}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-jade text-white rounded-xl hover:bg-jade-mid transition-colors disabled:opacity-50 shadow-sm"
            >
              <CheckCircle2 size={15} />
              Chuyển → {STATUS_CONFIG[nextStatus]?.label}
            </button>
          )}

          {/* Cancel */}
          {banquet.status !== "CANCELLED" && banquet.status !== "COMPLETED" && (
            <button
              onClick={() => {
                if (confirm("Xác nhận hủy tiệc này?")) {
                  saveUpdate({ status: "CANCELLED" as never });
                }
              }}
              className="w-full py-2 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              Hủy tiệc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({
  banquets,
  currentMonth,
  onSelect,
}: {
  banquets: Banquet[];
  currentMonth: string;
  onSelect: (b: Banquet) => void;
}) {
  const [year, month] = currentMonth.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // Map date → banquets
  const byDay: Record<number, Banquet[]> = {};
  banquets.forEach((b) => {
    const d = new Date(b.eventDate).getDate();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(b);
  });

  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-3">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-[80px] divide-x divide-y divide-gray-100">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`relative p-1.5 overflow-hidden ${
              day ? "hover:bg-gray-50/70 cursor-default" : "bg-gray-50/30"
            }`}
          >
            {day && (
              <>
                <span
                  className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday(day)
                      ? "bg-jade text-white"
                      : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-1 space-y-0.5 overflow-hidden">
                  {(byDay[day] ?? []).slice(0, 2).map((b) => {
                    const cfg = STATUS_CONFIG[b.status];
                    return (
                      <button
                        key={b.id}
                        onClick={() => onSelect(b)}
                        className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate ${cfg?.color} hover:opacity-80 transition-opacity`}
                      >
                        {formatTime(b.eventDate)} {b.eventType}
                      </button>
                    );
                  })}
                  {(byDay[day]?.length ?? 0) > 2 && (
                    <p className="text-[10px] text-muted-foreground pl-1">
                      +{(byDay[day]?.length ?? 0) - 2} nữa
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BanquetsAdminClient({
  banquets: initialBanquets,
  upcoming,
  monthStats,
  currentMonth,
  currentStatus,
  view: initialView,
}: BanquetsAdminClientProps) {
  const router = useRouter();
  const [banquets, setBanquets] = useState(initialBanquets);
  const [view, setView] = useState<"list" | "calendar">(initialView);
  const [selected, setSelected] = useState<Banquet | null>(null);

  const [year, month] = currentMonth.split("-").map(Number);

  const navigateMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/admin/banquets?month=${newMonth}&view=${view}`);
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    params.set("month", currentMonth);
    params.set("view", view);
    if (status) params.set("status", status);
    router.push(`/admin/banquets?${params.toString()}`);
  };

  const handleUpdated = (updated: Banquet) => {
    setBanquets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setSelected(updated);
  };

  const MONTH_NAMES = [
    "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
  ];

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Tổng tiệc tháng", value: monthStats.total, icon: CalendarDays, color: "text-jade" },
          { label: "Doanh thu tiệc", value: formatPrice(monthStats.revenue), icon: TrendingUp, color: "text-terra" },
          { label: "Đã xác nhận", value: monthStats.byStatus["CONFIRMED"] ?? 0, icon: CheckCircle2, color: "text-green-600" },
          { label: "Chờ báo giá", value: monthStats.byStatus["INQUIRY"] ?? 0, icon: AlertCircle, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Icon size={13} className={color} />
              {label}
            </div>
            <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming alert */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-3">
            <Bell size={15} />
            {upcoming.length} sự kiện trong 7 ngày tới
          </div>
          <div className="space-y-2">
            {upcoming.map((b) => {
              const d = daysUntil(b.eventDate);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="w-full flex items-center justify-between text-left bg-white rounded-xl px-4 py-3 hover:shadow-sm transition-shadow border border-amber-100"
                >
                  <div>
                    <p className="font-semibold text-sm text-ink">{b.eventType}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.customer?.name} · {b.guestCount} khách · {b.room?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-terra">
                      {d === 0 ? "Hôm nay" : d === 1 ? "Ngày mai" : `${d} ngày nữa`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatTime(b.eventDate)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Month nav */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-[rgb(var(--border))] px-3 py-2">
          <button onClick={() => navigateMonth(-1)} className="hover:text-jade transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-ink min-w-[100px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={() => navigateMonth(1)} className="hover:text-jade transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Status filter */}
        <select
          value={currentStatus}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex bg-white border border-[rgb(var(--border))] rounded-xl overflow-hidden ml-auto">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              view === "list" ? "bg-jade text-white" : "text-muted-foreground hover:bg-gray-50"
            }`}
          >
            <List size={15} />
            Danh sách
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              view === "calendar" ? "bg-jade text-white" : "text-muted-foreground hover:bg-gray-50"
            }`}
          >
            <CalendarDays size={15} />
            Lịch
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "calendar" ? (
        <CalendarView
          banquets={banquets}
          currentMonth={currentMonth}
          onSelect={setSelected}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {banquets.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <CalendarDays size={40} className="mx-auto mb-3 opacity-20" />
              <p>Không có sự kiện nào trong tháng này</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {banquets.map((b) => {
                const cfg = STATUS_CONFIG[b.status];
                const d = daysUntil(b.eventDate);
                const isPast = d < 0;

                return (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors text-left"
                  >
                    {/* Date block */}
                    <div className={`flex-shrink-0 w-14 text-center rounded-xl py-2 ${
                      isPast ? "bg-gray-100" : "bg-jade-light"
                    }`}>
                      <p className={`text-lg font-bold font-display leading-none ${
                        isPast ? "text-gray-400" : "text-jade"
                      }`}>
                        {new Date(b.eventDate).getDate()}
                      </p>
                      <p className={`text-[10px] font-medium ${
                        isPast ? "text-gray-400" : "text-jade/70"
                      }`}>
                        {new Date(b.eventDate).toLocaleDateString("vi-VN", { month: "short" })}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-ink text-sm">{b.eventType}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock size={11} /> {formatTime(b.eventDate)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users size={11} /> {b.guestCount} khách
                            </span>
                            {b.room && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={11} /> {b.room.name}
                              </span>
                            )}
                          </div>
                          {b.customer && (
                            <p className="text-xs text-muted-foreground mt-1">
                              👤 {b.customer.name} · {b.customer.phone}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg?.color}`}>
                            {cfg?.label}
                          </span>
                          {b.totalPrice && (
                            <span className="text-xs font-bold text-terra price-tag">
                              {formatPrice(b.totalPrice)}
                            </span>
                          )}
                          {!isPast && d <= 3 && (
                            <span className="text-[10px] font-bold text-amber-500">
                              {d === 0 ? "Hôm nay!" : `${d} ngày nữa`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <BanquetDetailModal
          banquet={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}
