// src/components/admin/PosClient.tsx
"use client";

import { useMemo, useState } from "react";
import { Plus, Minus, Trash2, Search, ShoppingCart } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category: { id: string; name: string; slug: string };
}

interface Table {
  id: string;
  name: string;
  area: string | null;
  capacity: number;
  status: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface PosClientProps {
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PosClient({ categories, menuItems, tables }: PosClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [guestCount, setGuestCount] = useState(4);
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const okCategory = activeCategory === "all" || item.category.slug === activeCategory;
      const q = search.trim().toLowerCase();
      const okSearch = !q || item.name.toLowerCase().includes(q);
      return okCategory && okSearch;
    });
  }, [menuItems, activeCategory, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItemId === item.id);
      if (idx >= 0) {
        const cloned = [...prev];
        cloned[idx] = { ...cloned[idx], quantity: cloned[idx].quantity + 1 };
        return cloned;
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: qty } : i)));
  };

  const placeOrder = async () => {
    setMessage(null);
    setError(null);

    if (cart.length === 0) {
      setError("Vui lòng chọn ít nhất 1 món.");
      return;
    }

    if (orderType === "DINE_IN" && !tableId) {
      setError("Đơn tại bàn cần chọn bàn.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: orderType,
        tableId: orderType === "DINE_IN" ? tableId : null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        guestCount,
        note: note || null,
        items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
      };

      const res = await fetch("/api/admin/pos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể tạo đơn POS");
      }

      setMessage(`Tạo đơn thành công: ${json.data.orderCode}`);
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
      <section className="bg-white border border-[var(--admin-border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--admin-border)] flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món nhanh..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-[var(--admin-border)] rounded-lg"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                activeCategory === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  activeCategory === cat.slug ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto">
          {filteredMenu.map((item) => (
            <article key={item.id} className="border border-[var(--admin-border)] rounded-xl p-3 bg-white hover:shadow-sm transition-shadow">
              <p className="text-sm font-semibold text-slate-800 line-clamp-2 min-h-[40px]">{item.name}</p>
              <p className="text-xs text-slate-500 mt-1">{item.category.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-emerald-700 text-sm">{formatCurrency(item.price)}</span>
                <button
                  onClick={() => addItem(item)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  <Plus size={14} className="inline mr-1" /> Thêm
                </button>
              </div>
            </article>
          ))}
          {filteredMenu.length === 0 && <p className="text-sm text-slate-500">Không có món phù hợp.</p>}
        </div>
      </section>

      <section className="bg-white border border-[var(--admin-border)] rounded-2xl shadow-sm p-4 space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-wider font-semibold text-slate-500">Đơn POS</h2>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShoppingCart size={16} /> {cartCount} món
          </div>
        </div>

        {(message || error) && (
          <div className={`rounded-lg px-3 py-2 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`py-2 text-sm rounded-lg font-semibold ${orderType === "DINE_IN" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Tại bàn
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            className={`py-2 text-sm rounded-lg font-semibold ${orderType === "TAKEAWAY" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Mang về
          </button>
        </div>

        {orderType === "DINE_IN" && (
          <label className="text-sm text-slate-700 block">
            Bàn phục vụ
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
            >
              <option value="">-- Chọn bàn --</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.area ? `(${t.area})` : ""} - {t.capacity} khách - {t.status}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-slate-700">
            Tên khách
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
              placeholder="Không bắt buộc"
            />
          </label>
          <label className="text-sm text-slate-700">
            SĐT khách
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
              placeholder="0xxxxxxxxx"
            />
          </label>
        </div>

        <label className="text-sm text-slate-700 block">
          Số khách
          <input
            type="number"
            min={1}
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg"
          />
        </label>

        <label className="text-sm text-slate-700 block">
          Ghi chú đơn
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 border border-[var(--admin-border)] rounded-lg resize-none"
            rows={2}
          />
        </label>

        <div className="border border-[var(--admin-border)] rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold">Giỏ món</div>
          <div className="max-h-52 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.menuItemId} className="px-3 py-2 border-t border-[var(--admin-border)] text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-700">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.menuItemId, item.quantity - 1)} className="w-7 h-7 rounded border flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, item.quantity + 1)} className="w-7 h-7 rounded border flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => updateQty(item.menuItemId, 0)} className="w-7 h-7 rounded border flex items-center justify-center text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-500">Chưa có món nào.</div>}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Tổng tạm tính</span>
          <strong className="text-lg text-emerald-700">{formatCurrency(cartTotal)}</strong>
        </div>

        <button
          onClick={placeOrder}
          disabled={saving || cart.length === 0}
          className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Đang tạo đơn..." : "Xác nhận tạo đơn POS"}
        </button>
      </section>
    </div>
  );
}
