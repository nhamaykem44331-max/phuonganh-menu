// src/components/admin/MenuManagerClient.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus, Search, Pencil, EyeOff, Eye, Trash2,
  X, Save, Loader2, UtensilsCrossed,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MenuItem {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  tags: string[];
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: { id: string; name: string; slug: string };
}

interface MenuManagerClientProps {
  initialItems: MenuItem[];
  categories: Category[];
}

const TAGS = [
  { value: "hot", label: "🔥 HOT" },
  { value: "new", label: "✨ MỚI" },
  { value: "best_seller", label: "⭐ Bán chạy" },
  { value: "vegetarian", label: "🥦 Chay" },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

// ─── Modal Form ──────────────────────────────────────────────────────────────
interface ModalProps {
  item: Partial<MenuItem> | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function MenuItemModal({ item, categories, onClose, onSaved }: ModalProps) {
  const isEdit = !!item?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: item?.name ?? "",
    nameEn: item?.nameEn ?? "",
    description: item?.description ?? "",
    price: item?.price ?? 0,
    originalPrice: item?.originalPrice ?? "",
    imageUrl: item?.imageUrl ?? "",
    categoryId: item?.categoryId ?? (categories[0]?.id ?? ""),
    tags: item?.tags ?? [],
    isAvailable: item?.isAvailable ?? true,
    sortOrder: item?.sortOrder ?? 0,
  });

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      };

      const url = isEdit
        ? `/api/admin/menu-items/${item!.id}`
        : "/api/admin/menu-items";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi lưu dữ liệu");

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-ink">
            {isEdit ? "Sửa món" : "Thêm món mới"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Danh mục <span className="text-red-400">*</span>
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Name VI + EN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Tên món (VI) <span className="text-red-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                placeholder="Gà nướng mật ong"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Tên món (EN)
              </label>
              <input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                placeholder="Honey Grilled Chicken"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 resize-none"
              placeholder="Mô tả ngắn về món ăn..."
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Giá bán (đ) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                placeholder="180000"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Giá gốc (gạch)
              </label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                placeholder="220000"
                min={0}
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              URL ảnh (Cloudinary)
            </label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
              placeholder="https://res.cloudinary.com/..."
            />
            {form.imageUrl && (
              <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTag(value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.tags.includes(value)
                      ? "bg-jade text-white border-jade"
                      : "border-[rgb(var(--border))] text-muted-foreground hover:border-jade/40"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Status + Sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Trạng thái
              </label>
              <select
                value={form.isAvailable ? "true" : "false"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isAvailable: e.target.value === "true" }))
                }
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 bg-white"
              >
                <option value="true">🟢 Đang phục vụ</option>
                <option value="false">🔴 Tạm ẩn</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Thứ tự
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium border border-[rgb(var(--border))] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-jade hover:bg-jade-mid text-white rounded-xl transition-all disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Đang lưu..." : "Lưu lại"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MenuManagerClient({ initialItems, categories }: MenuManagerClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [modalItem, setModalItem] = useState<Partial<MenuItem> | null | undefined>(undefined);
  // undefined = closed, null = new item, object = edit item

  const filtered = items.filter((item) => {
    const matchCat = filterCat === "all" || item.categoryId === filterCat;
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchCat && matchSearch;
  });

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
        )
      );
    } catch {
      alert("Không thể cập nhật trạng thái");
    }
  };

  const handleSaved = useCallback(() => {
    setModalItem(undefined);
    router.refresh();
    // Re-fetch items (simple approach)
    fetch("/api/admin/menu-items?limit=200")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, [router]);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên món..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Add button */}
        <button
          onClick={() => setModalItem(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-jade text-white text-sm font-semibold rounded-xl hover:bg-jade-mid transition-colors shadow-sm"
        >
          <Plus size={16} />
          Thêm món
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Món ăn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Danh mục</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Giá</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Tags</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trạng thái</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-jade-light">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-jade-light flex items-center justify-center text-lg flex-shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate max-w-[160px]">{item.name}</p>
                        {item.nameEn && (
                          <p className="text-xs text-muted-foreground italic truncate max-w-[160px]">{item.nameEn}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-jade-light text-jade px-2 py-1 rounded-lg font-medium">
                      {item.category.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-bold text-terra price-tag text-sm">{formatPrice(item.price)}</p>
                    {item.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-terra-light text-terra rounded-md font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        item.isAvailable
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {item.isAvailable ? "🟢 Có sẵn" : "🔴 Ẩn"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setModalItem(item)}
                        className="w-8 h-8 rounded-lg bg-jade-light text-jade flex items-center justify-center hover:bg-jade hover:text-white transition-all"
                        title="Sửa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
                        title={item.isAvailable ? "Ẩn món" : "Hiện món"}
                      >
                        {item.isAvailable ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <UtensilsCrossed size={36} className="mx-auto mb-3 opacity-20" />
              <p>Không tìm thấy món nào</p>
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-muted-foreground">
          Hiển thị {filtered.length} / {items.length} món
        </div>
      </div>

      {/* Modal */}
      {modalItem !== undefined && (
        <MenuItemModal
          item={modalItem}
          categories={categories}
          onClose={() => setModalItem(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
