// src/components/admin/MenuManagerClient.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Plus, Search, Pencil, EyeOff, Eye, Trash2,
  X, Save, Loader2, UtensilsCrossed, Copy, CheckSquare, Square,
  CheckCircle2, AlertCircle
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
  descriptionEn: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  tags: string[];
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  createdAt?: string | Date;
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

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string, type: "success" | "error", onClose: () => void }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 font-ui ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <p className="font-medium text-sm">{message}</p>
      <button onClick={onClose} className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Modal Form ──────────────────────────────────────────────────────────────
interface ModalProps {
  item: Partial<MenuItem> | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
  onDuplicate?: (item: MenuItem) => void;
}

function MenuItemModal({ item, categories, onClose, onSaved, onDuplicate }: ModalProps) {
  const isEdit = !!item?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: item?.name ?? "",
    nameEn: item?.nameEn ?? "",
    description: item?.description ?? "",
    descriptionEn: item?.descriptionEn ?? "",
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
      setError("Vui lòng điền đầy đủ thông tin bắt buộc (Tên món, Giá, Danh mục)");
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

      onSaved(isEdit ? "Cập nhật món thành công và đã đồng bộ!" : "Thêm món mới thành công và đã đồng bộ!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-[var(--admin-border)] flex items-center justify-between z-10">
          <h3 className="font-display text-2xl font-bold text-slate-800">
            {isEdit ? "Chi tiết món ăn" : "Thêm món mới"}
          </h3>
          <div className="flex items-center gap-2">
            {isEdit && onDuplicate && (
              <button
                onClick={() => onDuplicate(item as MenuItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-semibold font-ui"
              >
                <Copy size={14} /> Nhân bản
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <X size={16} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 font-ui">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cột 1: Thông tin cơ bản */}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 bg-white transition-shadow"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Tên món (VI) <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-semibold text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 transition-shadow"
                  placeholder="Ví dụ: Gà quay hoàng gia"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Tên món (EN)
                </label>
                <input
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 transition-shadow"
                  placeholder="Royal Roasted Chicken"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Giá bán (đ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 text-sm font-bold text-[var(--admin-primary)] border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                    placeholder="180000"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Giá gốc (đ)
                  </label>
                  <input
                    type="number"
                    value={form.originalPrice || ""}
                    onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm text-slate-500 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                    placeholder="220000"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Cột 2: Hình ảnh & Mô tả mở rộng */}
            <div className="space-y-4">
              {/* Image Preview */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Hình ảnh minh họa
                </label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm font-medium text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </div>
                  <div className="w-16 h-16 rounded-xl border border-[var(--admin-border)] overflow-hidden bg-slate-50 shrink-0 relative flex items-center justify-center">
                    {form.imageUrl ? (
                      <Image src={form.imageUrl} alt="preview" fill className="object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center font-medium">Trống</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Mô tả (VI)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 resize-none"
                  placeholder="Mô tả hấp dẫn về món ăn..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Mô tả (EN)
                </label>
                <textarea
                  value={form.descriptionEn}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 text-sm text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 resize-none"
                  placeholder="English description..."
                />
              </div>

              {/* Tags & Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  Nhãn / Phân loại (Tags)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(({ value, label }) => {
                    const active = form.tags.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleTag(value)}
                        className={`text-[11px] px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                          active
                            ? "bg-[var(--admin-primary)] text-white border-[var(--admin-primary)] shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 pt-4 border-t border-[var(--admin-border)]">
             <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Trạng thái hiển thị
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setForm((f) => ({ ...f, isAvailable: true }))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                       form.isAvailable ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🟢 Đang phục vụ
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, isAvailable: false }))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                       !form.isAvailable ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🔴 Tạm ẩn
                  </button>
                </div>
             </div>
             <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                 value={form.sortOrder}
                 onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                 className="w-full px-3 py-2 text-sm text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                 min={0}
                 title="Số càng nhỏ càng lên trước"
               />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-[var(--admin-border)] flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-[var(--admin-primary)] hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px]"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Đang xử lý..." : "Lưu Thay Đổi"}
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
  
  // Table state
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof MenuItem; direction: "asc" | "desc" }>({ key: "sortOrder", direction: "asc" });
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Bulk action state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / UI state
  const [modalItem, setModalItem] = useState<Partial<MenuItem> | null | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Duplicate handler
  const handleDuplicate = (item: MenuItem) => {
    setModalItem({ ...item, id: undefined, name: item.name + " (Copy)" });
    showToast("Đã nhân bản, vui lòng sửa thông tin trước khi lưu.", "success");
  };

  // Toggle single item status
  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/admin/menu-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (!res.ok) throw new Error();

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
        )
      );
      showToast(`Đã ${!item.isAvailable ? "hiển thị" : "ẩn"} món ${item.name}`, "success");
    } catch {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  // Update single field inline (SortOrder)
  const handleInlineSortUpdate = async (id: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (!res.ok) throw new Error();
      
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, sortOrder: newOrder } : i));
      showToast("Đã lưu thứ tự và đồng bộ", "success");
    } catch {
      showToast("Lỗi khi cập nhật thứ tự", "error");
    }
  };

  // Bulk hide/show
  const handleBulkStatusChange = async (isAvailable: boolean) => {
    if (selectedIds.size === 0) return;
    try {
      // In a real app we'd have a bulk update API. Here we wait for Promise.all
      const promises = Array.from(selectedIds).map(id => 
        fetch(`/api/admin/menu-items/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable }),
        })
      );
      await Promise.all(promises);

      setItems((prev) =>
        prev.map((i) => selectedIds.has(i.id) ? { ...i, isAvailable } : i)
      );
      setSelectedIds(new Set());
      showToast(`Đã cập nhật trạng thái ${selectedIds.size} món`, "success");
    } catch {
      showToast("Lỗi khi thao tác hàng loạt", "error");
    }
  };

  const handleSaved = useCallback((message: string) => {
    setModalItem(undefined);
    showToast(message, "success");
    // Soft reload dataset
    fetch("/api/admin/menu-items?limit=200")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
  }, [showToast]);

  // Derived states
  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      const matchCat = filterCat === "all" || item.categoryId === filterCat;
      const matchStatus = filterStatus === "all" ? true : (filterStatus === "active" ? item.isAvailable : !item.isAvailable);
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false);
      return matchCat && matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key];
      let bVal: any = b[sortConfig.key];
      
      // Fallbacks
      if (aVal === null) aVal = "";
      if (bVal === null) bVal = "";
      if (sortConfig.key === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, search, filterCat, filterStatus, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currPage - 1) * itemsPerPage, currPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length && paginated.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên món (VI/EN)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 font-ui shadow-sm transition-shadow"
            />
          </div>

          {/* Filters */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 shadow-sm transition-shadow font-ui w-auto"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 shadow-sm transition-shadow font-ui w-auto"
          >
            <option value="all">Trạng thái (Tất cả)</option>
            <option value="active">🟢 Đang phục vụ</option>
            <option value="hidden">🔴 Đã ẩn</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 bg-slate-100 rounded-xl px-2 py-1 border border-slate-200">
              <span className="text-xs font-semibold text-slate-600 px-2 font-ui">{selectedIds.size} đã chọn</span>
              <button 
                onClick={() => handleBulkStatusChange(true)}
                className="text-[11px] font-bold px-3 py-1.5 bg-white text-green-700 rounded-lg shadow-sm border border-slate-200 hover:bg-green-50 transition-colors"
              >
                Hiện nhóm
              </button>
              <button 
                onClick={() => handleBulkStatusChange(false)}
                className="text-[11px] font-bold px-3 py-1.5 bg-white text-red-600 rounded-lg shadow-sm border border-slate-200 hover:bg-red-50 transition-colors"
              >
                Ẩn nhóm
              </button>
            </div>
          )}
          
          <button
            onClick={() => setModalItem(null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--admin-primary)] text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-[var(--admin-primary)]/20 whitespace-nowrap w-full lg:w-auto"
          >
            <Plus size={18} strokeWidth={2.5} />
            Thêm món mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--admin-card)] rounded-2xl shadow-sm border border-[var(--admin-border)] overflow-hidden font-ui">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-[var(--admin-border)]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">
                   <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700 transition-colors">
                     {selectedIds.size === paginated.length && paginated.length > 0 ? <CheckSquare size={18} className="text-[var(--admin-primary)]" /> : <Square size={18} />}
                   </button>
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: "name", direction: sortConfig.key === "name" && sortConfig.direction === "asc" ? "desc" : "asc" })}>
                  Món ăn {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] hidden sm:table-cell cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: "categoryId", direction: sortConfig.key === "categoryId" && sortConfig.direction === "asc" ? "desc" : "asc" })}>
                  Danh mục
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: "price", direction: sortConfig.key === "price" && sortConfig.direction === "asc" ? "desc" : "asc" })}>
                  Giá bán {sortConfig.key === "price" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] hidden xl:table-cell">
                  Nhãn (Tags)
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center cursor-pointer hover:bg-slate-100" onClick={() => setSortConfig({ key: "sortOrder", direction: sortConfig.key === "sortOrder" && sortConfig.direction === "asc" ? "desc" : "asc" })}>
                  Thứ tự {sortConfig.key === "sortOrder" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">
                  Trạng thái
                </th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center w-24">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {paginated.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr key={item.id} className={`transition-colors group ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/70"}`}>
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => toggleSelect(item.id)} className="text-slate-400 hover:text-slate-700 transition-colors">
                        {isSelected ? <CheckSquare size={18} className="text-[var(--admin-primary)]" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3 max-w-[280px]">
                        {item.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-[var(--admin-border)] shadow-sm">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl border border-[var(--admin-border)] bg-slate-50 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                            🍽️
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate text-[14px] leading-tight mb-0.5">{item.name}</p>
                          {item.nameEn && (
                            <p className="text-xs text-slate-500 italic truncate font-medium">{item.nameEn}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                        {item.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right flex-col justify-center">
                      <p className="font-bold text-[15px] font-display text-[var(--admin-primary)] tracking-tight">
                        {formatPrice(item.price)}
                      </p>
                      {item.originalPrice && (
                        <p className="text-[11px] text-slate-400 line-through font-medium block">
                          {formatPrice(item.originalPrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1 w-40">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 border border-slate-200 bg-white text-slate-600 rounded font-bold uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                       <input 
                         type="number"
                         value={item.sortOrder}
                         className="w-14 text-center text-xs font-bold py-1 border border-transparent rounded hover:border-[var(--admin-border)] focus:border-[var(--admin-primary)] focus:bg-white bg-slate-50 transition-all outline-none"
                         onChange={(e) => handleInlineSortUpdate(item.id, Number(e.target.value))}
                         onBlur={(e) => handleInlineSortUpdate(item.id, Number(e.target.value))}
                       />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                          item.isAvailable
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {item.isAvailable ? "🟢 Đang bán" : "🔴 Tạm ẩn"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setModalItem(item)}
                          className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-[var(--admin-primary)] hover:text-white transition-all border border-indigo-100 hover:border-[var(--admin-primary)]"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {paginated.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <UtensilsCrossed size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">Chưa có dữ liệu phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>

        {/* Pagination & Footer */}
        <div className="px-6 py-4 border-t border-[var(--admin-border)] bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-slate-500">
            Hiển thị <span className="text-slate-900 font-bold">{paginated.length > 0 ? (currPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currPage * itemsPerPage, filtered.length)}</span> trong số <span className="text-slate-900 font-bold">{filtered.length}</span> món
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                disabled={currPage === 1}
                onClick={() => setPage(p => p - 1)}
                 className="px-3 py-1.5 text-xs font-bold border border-[var(--admin-border)] rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                >
                Trước
              </button>
              <div className="px-3 text-xs font-bold text-slate-600">Trang {currPage} / {totalPages}</div>
              <button 
                 disabled={currPage === totalPages}
                 onClick={() => setPage(p => p + 1)}
                 className="px-3 py-1.5 text-xs font-bold border border-[var(--admin-border)] rounded-lg bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
               >
                 Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {modalItem !== undefined && (
        <MenuItemModal
          item={modalItem}
          categories={categories}
          onClose={() => setModalItem(undefined)}
          onSaved={handleSaved}
          onDuplicate={handleDuplicate}
        />
      )}
    </>
  );
}
