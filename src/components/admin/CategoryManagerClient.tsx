// src/components/admin/CategoryManagerClient.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Pencil, X, Save, Loader2, Tag, CheckSquare, Square, CheckCircle2, AlertCircle
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | Date;
  _count?: { menuItems: number };
}

interface CategoryManagerClientProps {
  initialItems: Category[];
}

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
  item: Partial<Category> | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const SUGGESTED_ICONS = [
  "🔥", "⭐", "✨", "👑", "💎", "💯", "🏆", "🌟",
  "🍔", "🍕", "🍗", "🥩", "🥓", "🍖", "🌭", "🥪",
  "🍜", "🍲", "🍛", "🍝", "🍱", "🍣", "🥗", "🥘",
  "🌮", "🌯", "🥟", "🍤", "🍙", "🍘", "🍢", "🍳",
  "🍰", "🍮", "🍦", "🍧", "🍨", "🍩", "🍪", "🎂",
  "☕", "🍵", "🥤", "🧋", "🍹", "🍸", "🍷", "🍺", "🥂", "🧊",
  "🌶️", "🥦", "🥬", "🌽", "🥕", "🥑", "🍆", "🍅", "🍄", "🧅",
  "🐟", "🐠", "🦀", "🦞", "🐙", "🦑", "🦐", "🐡",
  "🍎", "🍓", "🍉", "🍇", "🍌", "🍍", "🥭", "🥥"
];

function CategoryModal({ item, onClose, onSaved }: ModalProps) {
  const isEdit = !!item?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showIcons, setShowIcons] = useState(false);
  const [form, setForm] = useState({
    name: item?.name ?? "",
    nameEn: item?.nameEn ?? "",
    slug: item?.slug ?? "",
    icon: item?.icon ?? "",
    isActive: item?.isActive ?? true,
    sortOrder: item?.sortOrder ?? 0,
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên danh mục");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/admin/categories/${item!.id}` : "/api/admin/categories";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi lưu dữ liệu");

      onSaved(isEdit ? "Cập nhật danh mục thành công!" : "Thêm danh mục mới thành công!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-white px-6 pt-5 pb-4 border-b border-[var(--admin-border)] flex items-center justify-between z-10 shrink-0">
          <h3 className="font-display text-2xl font-bold text-slate-800">
            {isEdit ? "Chi tiết danh mục" : "Thêm danh mục"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X size={16} className="text-slate-600" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 font-ui overflow-y-auto min-h-[300px]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Tên danh mục (VI) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-semibold text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                placeholder="Món chay, Món nướng..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Tên danh mục (EN)
              </label>
              <input
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm font-medium text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                placeholder="Vegetarian, Grilled..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Icon (Emoji / Class)
                </label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  onFocus={() => setShowIcons(true)}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                  placeholder="🔥, 🥦, 🍗"
                />
                
                {/* Icon Picker Popover */}
                {showIcons && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowIcons(false)} />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="flex justify-between items-center px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Gợi ý Icon</span>
                        <button type="button" onClick={() => setShowIcons(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-1 p-2 max-h-48 overflow-y-auto">
                        {SUGGESTED_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => { setForm(f => ({ ...f, icon })); setShowIcons(false); }}
                            className="text-lg hover:bg-indigo-50 hover:scale-110 rounded transition-all flex items-center justify-center p-1.5 cursor-pointer"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Đường dẫn ảo (Slug)
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-500 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 bg-slate-50"
                  placeholder="Tuy chọn (Auto nếu trống)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-4 border-t border-[var(--admin-border)]">
               <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    Trạng thái
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setForm((f) => ({ ...f, isActive: true }))}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                         form.isActive ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      🟢 Hiện
                    </button>
                    <button
                      onClick={() => setForm((f) => ({ ...f, isActive: false }))}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                         !form.isActive ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      🔴 Ẩn
                    </button>
                  </div>
               </div>
               <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Thứ tự sắp xếp
                </label>
                <input
                  type="number"
                   value={form.sortOrder}
                   onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                   className="w-full px-3 py-2 text-sm text-slate-800 border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30"
                   min={0}
                 />
               </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-[var(--admin-border)] flex justify-end gap-3 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 flex items-center justify-center gap-2 text-sm font-bold bg-[var(--admin-primary)] hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Đang xử lý..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CategoryManagerClient({ initialItems }: CategoryManagerClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  
  const [search, setSearch] = useState("");
  const [modalItem, setModalItem] = useState<Partial<Category> | null | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleToggleActive = async (item: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      if (!res.ok) throw new Error();

      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
      showToast(`Đã ${!item.isActive ? "hiển thị" : "ẩn"} danh mục ${item.name}`, "success");
    } catch {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  const handleInlineSortUpdate = async (id: string, newOrder: number) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (!res.ok) throw new Error();
      
      setItems((prev) => {
        const sorted = prev.map((i) => i.id === id ? { ...i, sortOrder: newOrder } : i);
        return sorted.sort((a,b) => a.sortOrder - b.sortOrder);
      });
      showToast("Đã lưu thứ tự và đồng bộ", "success");
    } catch {
      showToast("Lỗi khi cập nhật thứ tự", "error");
    }
  };

  const handleSaved = useCallback((message: string) => {
    setModalItem(undefined);
    showToast(message, "success");
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setItems(json.data);
      });
    router.refresh();
  }, [showToast, router]);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameEn?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }, [items, search]);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên danh mục..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]/30 font-ui shadow-sm"
          />
        </div>

        <button
          onClick={() => setModalItem(null)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--admin-primary)] text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-[var(--admin-primary)]/20 whitespace-nowrap w-full sm:w-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          Tạo Danh Mục
        </button>
      </div>

      <div className="bg-[var(--admin-card)] rounded-2xl shadow-sm border border-[var(--admin-border)] overflow-hidden font-ui">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-[var(--admin-border)]">
              <tr>
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] w-12 text-center">Icon</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px]">Danh mục</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] hidden sm:table-cell">URL Slug</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">Số Món</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">Vị trí</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-center">Trạng thái</th>
                <th className="px-4 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3.5 text-center text-xl">
                    {item.icon || "📁"}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900 text-[14px] leading-tight mb-0.5">{item.name}</p>
                    {item.nameEn && <p className="text-xs text-slate-500 font-medium">{item.nameEn}</p>}
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      /{item.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-xs font-bold text-slate-700 bg-[var(--admin-bg)] px-2 py-1 rounded-md border border-[var(--admin-border)]">
                      {item._count?.menuItems || 0}
                    </span>
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
                      onClick={() => handleToggleActive(item)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                        item.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {item.isActive ? "🟢 Kích hoạt" : "🔴 Đang ẩn"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right w-24">
                    <div className="flex items-center justify-end gap-1.5">
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
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400">
                    <Tag size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Chưa có danh mục nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalItem !== undefined && (
        <CategoryModal
          item={modalItem}
          onClose={() => setModalItem(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
