// src/components/admin/OrdersClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "🔵 Mới" },
  { value: "CONFIRMED", label: "🟣 Xác nhận" },
  { value: "PREPARING", label: "🟡 Đang nấu" },
  { value: "SERVING", label: "🟢 Phục vụ" },
  { value: "PAID", label: "✅ Đã TT" },
  { value: "COMPLETED", label: "⬜ Xong" },
  { value: "CANCELLED", label: "🔴 Hủy" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Tất cả loại" },
  { value: "ONLINE", label: "🌐 Online" },
  { value: "DINE_IN", label: "🍽️ Tại bàn" },
  { value: "BANQUET", label: "🎉 Tiệc" },
  { value: "TAKEAWAY", label: "📦 Mang về" },
];

const STATUS_COLORS: Record<string, string> = {
  NEW:       "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PREPARING: "bg-amber-100 text-amber-700",
  SERVING:   "bg-green-100 text-green-700",
  PAID:      "bg-teal-100 text-teal-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới", CONFIRMED: "Xác nhận", PREPARING: "Đang nấu",
  SERVING: "Phục vụ", PAID: "Đã TT", COMPLETED: "Hoàn thành", CANCELLED: "Hủy",
};

const NEXT_STATUS: Record<string, string> = {
  NEW: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "SERVING",
  SERVING: "PAID",
  PAID: "COMPLETED",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(price);
}

interface Order {
  id: string;
  orderCode: string;
  customerName: string | null;
  customerPhone: string | null;
  guestCount: number | null;
  type: string;
  status: string;
  total: number;
  createdAt: Date;
  note: string | null;
  orderItems: Array<{ menuItem: { name: string }; quantity: number }>;
  staff: { name: string } | null;
  table: { name: string } | null;
}

interface OrdersClientProps {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  currentStatus: string;
  currentType: string;
}

export function OrdersClient({
  orders: initialOrders,
  total,
  page,
  limit,
  currentStatus,
  currentType,
}: OrdersClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch {
      alert("Không thể cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (key !== "status" && currentStatus) params.set("status", currentStatus);
    if (key !== "type" && currentType) params.set("type", currentType);
    if (value) params.set(key, value);
    params.set("page", "1");
    router.push(`/admin/orders?${params.toString()}`);
  };

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={currentStatus}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={currentType}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Mã đơn", "Khách hàng", "Thời gian", "Loại", "Trạng thái", "Tổng tiền", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-jade">
                        {order.orderCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-ink">{order.customerName ?? "—"}</p>
                      {order.customerPhone && (
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={11} />
                        {new Date(order.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit", minute: "2-digit",
                          day: "2-digit", month: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {TYPE_OPTIONS.find((t) => t.value === order.type)?.label ?? order.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-ink price-tag">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(order.id, NEXT_STATUS[order.status]);
                          }}
                          disabled={updatingId === order.id}
                          className="text-xs font-semibold px-3 py-1.5 bg-jade text-white rounded-lg hover:bg-jade-mid transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {updatingId === order.id ? "..." : `→ ${STATUS_LABELS[NEXT_STATUS[order.status]]}`}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === order.id && (
                    <tr key={`${order.id}-detail`} className="bg-jade-light/40">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                              Các món đã order
                            </p>
                            <ul className="space-y-1">
                              {order.orderItems.map((oi, i) => (
                                <li key={i} className="flex justify-between text-sm">
                                  <span className="text-ink">{oi.menuItem.name}</span>
                                  <span className="text-muted-foreground">x{oi.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2 text-sm">
                            {order.guestCount && (
                              <p><span className="text-muted-foreground">Số khách:</span> <strong>{order.guestCount}</strong></p>
                            )}
                            {order.table && (
                              <p><span className="text-muted-foreground">Bàn:</span> <strong>{order.table.name}</strong></p>
                            )}
                            {order.staff && (
                              <p><span className="text-muted-foreground">Nhân viên:</span> <strong>{order.staff.name}</strong></p>
                            )}
                            {order.note && (
                              <p><span className="text-muted-foreground">Ghi chú:</span> <em>{order.note}</em></p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              Không có đơn hàng nào
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm">
            <span className="text-xs text-muted-foreground">
              Trang {page} / {totalPages} · {total} đơn
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/orders?page=${page - 1}`)}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => router.push(`/admin/orders?page=${page + 1}`)}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
