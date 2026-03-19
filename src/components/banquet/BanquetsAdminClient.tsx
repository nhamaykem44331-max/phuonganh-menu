// src/components/banquet/BanquetsAdminClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Search, Plus, Download, X, Phone, Users,
  MapPin, Clock, CheckCircle2, AlertCircle, TrendingUp, CalendarDays,
  List as ListIcon, FileText, Send, Save, Edit, Trash2, Building2, LayoutGrid, Calendar as CalendarIcon, DollarSign
} from "lucide-react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Room { id: string; name: string; capacity: number; }
interface User { id: string; name: string; email: string | null; }

interface Banquet {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  companyName: string;
  roomId?: string;
  room?: { name: string; capacity: number };
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  tableCount: number;
  pricePerPerson: number | null;
  totalPrice: number | null;
  depositAmount: number | null;
  status: string;
  preOrderMenu: string;
  additionalServices: string[];
  note: string;
  staffAssigned: string | null;
  reminderSent: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeText: string }> = {
  INQUIRY:   { label: "Hỏi thông tin", color: "bg-blue-100 text-blue-700", badgeText: "Hỏi thông tin" },
  QUOTED:    { label: "Đã báo giá",    color: "bg-purple-100 text-purple-700", badgeText: "Đã báo giá" },
  CONFIRMED: { label: "Đã xác nhận",   color: "bg-green-100 text-green-700", badgeText: "Đã xác nhận" },
  DEPOSITED: { label: "Đã đặt cọc",    color: "bg-teal-100 text-teal-700", badgeText: "Đã đặt cọc" },
  COMPLETED: { label: "Hoàn thành",    color: "bg-gray-100 text-gray-600", badgeText: "Hoàn thành" },
  CANCELLED: { label: "Đã hủy",        color: "bg-red-100 text-red-700", badgeText: "Đã hủy" },
};

const EXTRA_SERVICES = ["Màn hình LED", "Âm thanh", "Máy chiếu", "MC", "Bánh kem", "Rượu đá khối", "Thảm đỏ"];
const TIME_OPTIONS = ["10:00", "11:00", "17:00", "17:30", "18:00", "18:30", "19:00"];

// ─── Utils ────────────────────────────────────────────────────────────────────
const formatPrice = (n: number | null) => {
  if (!n) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
};

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// ─── Components: BANQUET MODAL ────────────────────────────────────────────────
function BanquetModal({
  banquet, initialRoomId, initialDate, rooms, users, onClose, onSave
}: {
  banquet?: Banquet | null; initialRoomId?: string; initialDate?: string; rooms: Room[]; users: User[]; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: banquet?.customerName || "",
    customerPhone: banquet?.customerPhone || "",
    customerEmail: banquet?.customerEmail || "",
    companyName: banquet?.companyName || "",
    roomId: banquet?.roomId || initialRoomId || (rooms[0]?.id ?? ""),
    eventDate: banquet ? banquet.eventDate.split("T")[0] : initialDate || new Date().toISOString().split("T")[0],
    eventTime: banquet?.eventTime || "17:30",
    eventType: banquet?.eventType || "Tiệc liên hoan",
    guestCount: banquet?.guestCount || 0,
    tableCount: banquet?.tableCount || 0,
    pricePerPerson: banquet?.pricePerPerson || "",
    depositAmount: banquet?.depositAmount || "",
    preOrderMenu: banquet?.preOrderMenu || "",
    additionalServices: banquet?.additionalServices || [],
    staffAssigned: banquet?.staffAssigned || "",
    status: banquet?.status || "INQUIRY",
    note: banquet?.note || ""
  });

  const [customService, setCustomService] = useState("");

  const handleSave = async (asDraft = false) => {
    if (!form.customerName || !form.customerPhone || !form.roomId || !form.eventDate || !form.eventTime || !form.guestCount) {
      alert("Vui lòng điền đủ các trường có dấu *");
      return;
    }
    setSaving(true);
    const payload = {
      ...form, status: asDraft ? "INQUIRY" : form.status,
      eventDate: `${form.eventDate}T${form.eventTime}:00.000Z`,
      guestCount: Number(form.guestCount), tableCount: Number(form.tableCount),
      pricePerPerson: form.pricePerPerson ? Number(form.pricePerPerson) : null,
      depositAmount: form.depositAmount ? Number(form.depositAmount) : null,
    };
    try {
      const url = banquet ? `/api/admin/banquets/${banquet.id}` : `/api/admin/banquets`;
      const method = banquet ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Lỗi lưu tiệc");
      onSave();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  const handleSendReminder = async () => {
    if (!banquet) return;
    try {
      await fetch("http://localhost:5678/webhook/banquet-reminder", { 
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: banquet.bookingId, customerName: banquet.customerName, customerPhone: banquet.customerPhone,
          roomName: rooms.find(r => r.id === form.roomId)?.name || "", eventDate: form.eventDate, eventTime: form.eventTime,
          guestCount: form.guestCount, tableCount: form.tableCount, staffAssigned: users.find(u => u.id === form.staffAssigned)?.name || ""
        })
      });
      await fetch(`/api/admin/banquets/${banquet.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminderSent: true }) });
      alert("Đã gửi lời nhắc (giả lập webhook) thành công!");
      onSave();
    } catch { alert("Đã kích hoạt gửi lời nhắc!"); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex bg-slate-50 items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl">
          <h3 className="font-semibold text-lg text-slate-800">{banquet ? `Chi tiết tiệc: ${banquet.bookingId}` : "Thêm đặt tiệc mới"}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <div><label className="block text-slate-700 font-medium mb-1">Tên khách hàng *</label><input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              <div><label className="block text-slate-700 font-medium mb-1">Tên đơn vị/công ty</label><input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-700 font-medium mb-1">Số điện thoại *</label><input value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
                <div><label className="block text-slate-700 font-medium mb-1">Email</label><input value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              </div>
              <div className="pt-2 border-t mt-4">
                <label className="block text-slate-700 font-medium mb-2">Thông tin thanh toán & Ghi chú</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div><label className="block text-xs text-slate-500 mb-1">Số tiền cọc (đ)</label><input type="number" value={form.depositAmount} onChange={e => setForm({...form, depositAmount: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Nhân viên hỗ trợ</label>
                    <select value={form.staffAssigned} onChange={e => setForm({...form, staffAssigned: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                      <option value="">-- Chọn --</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tình trạng tiệc</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-slate-50 font-medium">
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="mt-3"><label className="block text-xs text-slate-500 mb-1">Ghi chú</label><textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-md resize-none" /></div>
              </div>
            </div>
            {/* Cột phải */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-slate-700 font-medium mb-1">Phòng / Sảnh *</label>
                  <select value={form.roomId} onChange={e => setForm({...form, roomId: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity} pax)</option>)}
                  </select>
                </div>
                <div><label className="block text-slate-700 font-medium mb-1">Loại sự kiện</label><input value={form.eventType} onChange={e => setForm({...form, eventType: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1"><label className="block text-slate-700 font-medium mb-1">Ngày *</label><input type="date" value={form.eventDate} onChange={e => setForm({...form, eventDate: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div><label className="block text-slate-700 font-medium mb-1">Giờ *</label>
                    <select value={form.eventTime} onChange={e => setForm({...form, eventTime: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-slate-700 font-medium mb-1">Khách *</label><input type="number" value={form.guestCount} onChange={e => setForm({...form, guestCount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-slate-700 font-medium mb-1">Bàn</label><input type="number" value={form.tableCount} onChange={e => setForm({...form, tableCount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" /></div>
                </div>
              </div>
              <div className="pt-2 border-t mt-4">
                <label className="block text-slate-700 font-medium mb-2">Thực đơn đặt trước</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div><label className="block text-xs text-slate-500 mb-1">Giá / người</label><input type="number" value={form.pricePerPerson} onChange={e => setForm({...form, pricePerPerson: e.target.value})} className="w-full px-3 py-2 border rounded-md" /></div>
                  <div><label className="block text-xs text-slate-500 mb-1">Tổng dự kiến</label><div className="w-full px-3 py-2 border rounded-md bg-slate-50 font-bold text-slate-600">{formatPrice(Number(form.pricePerPerson || 0) * (form.guestCount || 0))}</div></div>
                </div>
                <textarea placeholder="Ghi chú chi tiết thực đơn..." value={form.preOrderMenu} onChange={e => setForm({...form, preOrderMenu: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-md resize-none" />
              </div>
              <div className="pt-2 border-t mt-4">
                <label className="block text-slate-700 font-medium mb-2">Dịch vụ bổ sung</label>
                <div className="flex flex-wrap gap-2">
                  {EXTRA_SERVICES.map(svc => (
                    <label key={svc} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border rounded-md cursor-pointer hover:bg-slate-100">
                      <input type="checkbox" checked={form.additionalServices.includes(svc)} onChange={(e) => {
                        if (e.target.checked) setForm({...form, additionalServices: [...form.additionalServices, svc]});
                        else setForm({...form, additionalServices: form.additionalServices.filter(s => s !== svc)});
                      }} /> <span className="text-xs">{svc}</span>
                    </label>
                  ))}
                  <div className="flex w-full items-center gap-2 mt-1">
                    <input value={customService} onChange={e => setCustomService(e.target.value)} placeholder="Khác..." className="flex-1 px-3 py-1.5 text-xs border rounded-md" />
                    <button onClick={() => { if(customService) { setForm({...form, additionalServices: [...form.additionalServices, customService]}); setCustomService(""); } }} className="px-3 py-1.5 bg-slate-200 rounded-md text-xs font-medium shrink-0" type="button">Thêm</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
          <div className="flex gap-2">
            {banquet && (
              <>
                <button onClick={handleSendReminder} className="px-4 py-2 border bg-white border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 font-medium">
                  <Send size={16} /> Nhắc nhở {banquet.reminderSent && "(Đã gửi)"}
                </button>
                <button onClick={() => setForm({...form, status: "CANCELLED"})} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium border border-transparent hover:border-red-200 transition-all">Hủy tiệc</button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg font-medium transition-colors">Đóng</button>
            {!banquet && <button disabled={saving} onClick={() => handleSave(true)} className="px-5 py-2 text-slate-700 bg-white border hover:bg-slate-50 rounded-lg font-medium transition-colors">Lưu nháp</button>}
            <button disabled={saving} onClick={() => handleSave(false)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
              <Save size={16} /> {saving ? "Đang xử lý..." : banquet ? "Cập nhật tiệc" : "Xác nhận đặt tiệc"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Components: ROOM MODAL ───────────────────────────────────────────────────
function RoomModal({
  room, onClose, onSave
}: {
  room?: Room | null; onClose: () => void; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: room?.name || "",
    capacity: room?.capacity || 0,
  });

  const handleSave = async () => {
    if (!form.name || form.capacity <= 0) return alert("Nhập đủ Tên phòng và Sức chứa lớn hơn 0");
    setSaving(true);
    try {
      const url = room ? `/api/admin/rooms/${room.id}` : `/api/admin/rooms`;
      const res = await fetch(url, {
        method: room ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Lỗi lưu phòng");
      onSave();
    } catch { alert("Chưa thể lưu phòng, thử lại sau!"); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng/sảnh này? Hành động này không thể hoàn tác.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/rooms/${room!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xóa phòng (có thể đang có dữ liệu tiệc gắn vào)");
      onSave();
    } catch(e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex bg-slate-50 items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl">
          <h3 className="font-semibold text-lg text-slate-800">{room ? `Sửa: ${room.name}` : "Thêm Phòng/Sảnh"}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="block text-slate-700 font-medium mb-1">Tên phòng/sảnh *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-md" placeholder="VD: Sảnh A, VIP 1" /></div>
          <div><label className="block text-slate-700 font-medium mb-1">Sức chứa (người) *</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" /></div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-slate-50 rounded-b-xl flex items-center justify-between">
          <div>{room && <button disabled={saving} onClick={handleDelete} className="text-red-500 font-medium text-sm px-2 hover:underline flex items-center gap-1"><Trash2 size={14}/> Xóa</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg font-medium text-sm">Hủy</button>
            <button disabled={saving} onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"><Save size={16} /> Lưu</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Components: EXPORT MODAL ───────────────────────────────────────────────────
function ExportModal({ isOpen, onClose, fromDate, setFromDate, toDate, setToDate, onExport, exporting }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col">
        <div className="flex bg-slate-50 items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-xl">
          <h3 className="font-semibold text-lg text-slate-800">Xuất Excel Sơ đồ phòng</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-slate-700 font-medium mb-1 text-sm">Từ ngày *</label><input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-slate-700 font-medium mb-1 text-sm">Đến ngày *</label><input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" /></div>
          <p className="text-xs text-slate-500 italic">Dữ liệu xuất ra sẽ có định dạng lưới ma trận giống với Sơ đồ phòng.</p>
        </div>
        <div className="p-4 border-t border-gray-200 bg-slate-50 rounded-b-xl flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg font-medium text-sm">Hủy</button>
          <button disabled={exporting} onClick={onExport} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 text-sm"><Download size={16} /> {exporting ? "Đang xử lý..." : "Xác nhận xuất"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BanquetsAdminClient({ initialRooms, initialUsers }: { initialRooms: Room[], initialUsers: User[] }) {
  const [activeTab, setActiveTab] = useState<"overview" | "list" | "timeline" | "stats" | "rooms">("overview");
  
  // Data States
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [list, setList] = useState<Banquet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  
  const [timelineYear, setTimelineYear] = useState(new Date().getFullYear());
  const [timelineMonth, setTimelineMonth] = useState(new Date().getMonth() + 1);
  const [timelineData, setTimelineData] = useState<{ rooms: Room[], bookings: Banquet[] }>({ rooms, bookings: [] });

  // Modal Control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBanquet, setModalBanquet] = useState<Banquet | null>(null);
  const [modalInitRoom, setModalInitRoom] = useState("");
  const [modalInitDate, setModalInitDate] = useState("");
  
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomModalItem, setRoomModalItem] = useState<Room | null>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFrom, setExportFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [exportTo, setExportTo] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1, 0); return d.toISOString().split("T")[0]; });
  const [exporting, setExporting] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      if (res.ok) {
        const d = await res.json();
        setRooms(d.data);
      }
    } catch (e) {}
  }, []);

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterMonth) params.set("month", filterMonth);
    if (filterRoom) params.set("roomId", filterRoom);
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("q", search);
    try {
      const res = await fetch(`/api/admin/banquets?${params.toString()}`);
      if (res.ok) { const d = await res.json(); setList(d.data); setTotal(d.pagination.total); }
    } catch (e) {}
  }, [page, filterMonth, filterRoom, filterStatus, search]);

  const fetchTimeline = useCallback(async () => {
    try {
      const mStr = `${timelineYear}-${String(timelineMonth).padStart(2, "0")}`;
      const res = await fetch(`/api/admin/banquets/timeline?month=${mStr}`);
      if (res.ok) { const d = await res.json(); setTimelineData(d.data); }
    } catch (e) {}
  }, [timelineYear, timelineMonth]);

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "list") fetchList();
    if (activeTab === "timeline") fetchTimeline();
    if (activeTab === "stats" && list.length === 0) fetchList();
    if (activeTab === "rooms") fetchRooms();
  }, [activeTab, fetchList, fetchTimeline, fetchRooms]);

  const executeTimelineExport = async () => {
    if (!exportFrom || !exportTo) return alert("Vui lòng chọn Từ ngày và Đến ngày");
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/banquets?from=${exportFrom}T00:00:00.000Z&to=${exportTo}T23:59:59.999Z&limit=-1`);
      if (!res.ok) throw new Error("Lỗi tải dữ liệu");
      const { data: banquets } = await res.json();
      
      const from = new Date(exportFrom);
      const to = new Date(exportTo);
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / 86400000);
      if (daysDiff < 0 || daysDiff > 90) throw new Error("Khoảng thời gian không hợp lệ hoặc > 90 ngày.");
      
      const dateHeaders: string[] = [];
      const dateStrings: string[] = [];
      for (let i = 0; i <= daysDiff; i++) {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        dateHeaders.push(d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }));
        dateStrings.push(d.toISOString().split("T")[0]);
      }

      const headers = ["Phòng / Sảnh", ...dateHeaders];
      
      const csvRows = rooms.map(room => {
        const row = [room.name];
        for (const dateStr of dateStrings) {
          const bks = banquets.filter((b: any) => b.roomId === room.id && b.eventDate.startsWith(dateStr));
          if (bks.length === 0) row.push("");
          else {
            const cellText = bks.map((bk: any) => `[${bk.eventTime}] ${bk.customerName} (${bk.guestCount} khách)`).join("\n");
            row.push(cellText);
          }
        }
        return row;
      });

      const unassignedBks = banquets.filter((b: any) => !b.roomId);
      if (unassignedBks.length > 0) {
          const row = ["CHƯA XẾP PHÒNG"];
          for (const dateStr of dateStrings) {
            const bks = unassignedBks.filter((b: any) => b.eventDate.startsWith(dateStr));
            if (bks.length === 0) row.push("");
            else row.push(bks.map((bk: any) => `[${bk.eventTime}] ${bk.customerName} (${bk.guestCount} khách)`).join("\n"));
          }
          csvRows.push(row);
      }

      const ws = XLSX.utils.aoa_to_sheet([headers, ...csvRows]);
      
      // Auto-fit Cột 1 (Tên Phòng)
      ws['!cols'] = [{ wch: 25 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sơ đồ phòng");
      
      XLSX.writeFile(wb, `Sodo_Phong_${exportFrom}_to_${exportTo}.xlsx`);
      
      setExportModalOpen(false);
    } catch (e: any) { alert(e.message); } finally { setExporting(false); }
  };

  const timelineDays = Array.from({ length: new Date(timelineYear, timelineMonth, 0).getDate() }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-lg w-full max-w-full overflow-x-auto shrink-0 border border-slate-200/60 shadow-sm">
        <button onClick={() => setActiveTab("overview")} className={`shrink-0 px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${activeTab === "overview" ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-900"}`}><LayoutGrid size={16} /> Tổng quan</button>
        <button onClick={() => setActiveTab("list")} className={`shrink-0 px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${activeTab === "list" ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-900"}`}><ListIcon size={16} /> Danh sách tiệc</button>
        <button onClick={() => setActiveTab("timeline")} className={`shrink-0 px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${activeTab === "timeline" ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-900"}`}><CalendarDays size={16} /> Sơ đồ phòng</button>
        <button onClick={() => setActiveTab("stats")} className={`shrink-0 px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${activeTab === "stats" ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-900"}`}><TrendingUp size={16} /> Thống kê</button>
        <button onClick={() => setActiveTab("rooms")} className={`shrink-0 px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${activeTab === "rooms" ? "bg-white shadow-sm text-blue-700" : "text-slate-600 hover:text-slate-900"}`}><Building2 size={16} /> Quản lý Sảnh</button>
      </div>

      {/* ─── TAB 0: TỔNG QUAN (GIỐNG ẢNH MẪU) ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
             <div>
               <h1 className="text-xl md:text-2xl font-display font-semibold text-slate-800">Tiệc & Sự kiện</h1>
               <p className="text-xs md:text-sm text-slate-500 mt-1">Quản lý đặt tiệc, báo giá, theo dõi lịch sự kiện</p>
             </div>
             <button onClick={() => { setModalInitRoom(""); setModalInitDate(""); setModalBanquet(null); setModalOpen(true); }} className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm rounded-lg shadow-sm"><Plus size={16} /> Thêm đặt tiệc</button>
          </div>

          {/* Cards Tổng quan */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mb-2"><CalendarIcon size={16} /> Tổng tiệc tháng</div>
               <div className="text-2xl font-display font-medium text-slate-800">{list.length}</div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-slate-500 font-medium text-sm mb-2"><TrendingUp size={16} /> Doanh thu tiệc</div>
               <div className="text-2xl font-display font-bold text-slate-800">{formatPrice(list.reduce((sum, b) => ["CONFIRMED", "DEPOSITED", "COMPLETED"].includes(b.status) ? sum + (b.totalPrice || 0) : sum, 0))}</div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-green-600 font-medium text-sm mb-2"><CheckCircle2 size={16} /> Đã xác nhận</div>
               <div className="text-2xl font-display font-bold text-green-600">{list.filter(b => ["CONFIRMED", "DEPOSITED"].includes(b.status)).length}</div>
             </div>
             <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 text-amber-500 font-medium text-sm mb-2"><Clock size={16} /> Chờ báo giá</div>
               <div className="text-2xl font-display font-bold text-amber-500">{list.filter(b => ["INQUIRY", "QUOTED"].includes(b.status)).length}</div>
             </div>
          </div>

          {/* 7 ngày tới (Upcoming banner) */}
          {(() => {
            const upcoming = list.filter(b => ["CONFIRMED", "DEPOSITED"].includes(b.status) && (new Date(b.eventDate).getTime() - Date.now())/86400000 <= 7 && (new Date(b.eventDate).getTime() - Date.now())/86400000 >= -1).sort((a,b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
            if (upcoming.length === 0) return null;
            return (
              <div className="bg-[#FFFDF4] border border-[#FBE5A6] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-amber-700 mb-3 text-sm"><AlertCircle size={16} /> {upcoming.length} sự kiện trong 7 ngày tới</div>
                <div className="flex flex-col gap-2">
                  {upcoming.slice(0,3).map(bk => {
                    const daysLeft = Math.ceil((new Date(bk.eventDate).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={bk.id} onClick={() => { setModalBanquet(bk); setModalOpen(true); }} className="bg-white/60 hover:bg-white text-sm border-transparent hover:border-amber-200 border transition-colors p-3 rounded-lg flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-semibold text-slate-800 text-[13px]">{bk.eventType}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{bk.customerName} · {bk.guestCount} khách · {bk.room?.name || 'Chưa xếp phòng'}</p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className="font-semibold text-slate-800 text-[13px]">{daysLeft === 0 ? "Hôm nay" : daysLeft === 1 ? "Ngày mai" : `${daysLeft} ngày nữa`}</p>
                          <p className="font-medium text-slate-500 text-[12px]">{bk.eventTime}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })()}

          {/* Bộ lọc timeline */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
              <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden text-sm shadow-sm font-medium flex-1 sm:flex-none">
                <button className="px-2 md:px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <div className="flex items-center px-2 md:px-4 py-2 text-slate-700 border-x border-slate-100 flex-1 justify-center">
                   <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1); }} className="bg-transparent border-none outline-none p-0 w-auto m-0 text-sm font-semibold max-w-[100px] md:max-w-none text-center" />
                </div>
                <button className="px-2 md:px-3 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
              <div className="h-[38px] w-[130px] sm:w-auto">
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="h-full px-2 md:px-4 py-0 pl-2 pr-8 border border-slate-200 rounded-lg text-xs md:text-sm bg-white font-medium shadow-sm outline-none w-full appearance-none cursor-pointer" style={{background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 8px center`, backgroundColor: "white"}}>
                  <option value="">Tất cả</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex justify-center px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 font-medium shadow-sm gap-2 items-center cursor-pointer hover:bg-slate-50">
               <CalendarDays size={16} /> Lịch sự kiện
            </div>
          </div>

          {/* Danh sách chiều dọc */}
          <div className="bg-white shadow-sm border-t border-slate-100 mt-2 text-sm divide-y divide-slate-100 relative rounded-xl">
             {list.map(bk => {
               const day = new Date(bk.eventDate).getDate();
               const monthTitle = `Tháng ${new Date(bk.eventDate).getMonth() + 1}`;
               let displayStatusStyle = "bg-slate-100 text-slate-600";
               let displayPriceClass = "text-slate-700";
               if (bk.status === "INQUIRY" || bk.status === "QUOTED") displayStatusStyle = "bg-indigo-100/50 text-indigo-600 font-semibold";
               if (bk.status === "CONFIRMED" || bk.status === "DEPOSITED") displayStatusStyle = "bg-emerald-50 text-emerald-600 font-semibold";
               if (bk.status === "INQUIRY" || bk.status === "QUOTED") displayPriceClass = "text-amber-500";
               if (bk.status === "CONFIRMED" || bk.status === "DEPOSITED") displayPriceClass = "text-green-600";
               
               const daysLeft = Math.ceil((new Date(bk.eventDate).getTime() - Date.now()) / 86400000);
               const daysText = daysLeft === 0 ? "Hôm nay" : daysLeft < 0 ? "Đã qua" : `${daysLeft} ngày nữa`;
               
               return (
                 <div key={bk.id} onClick={() => { setModalBanquet(bk); setModalOpen(true); }} className="flex gap-3 md:gap-6 py-4 px-3 md:px-4 hover:bg-slate-50/50 cursor-pointer transition-colors group">
                   {/* Column 1: Date Box */}
                   <div className="flex flex-col items-center justify-start min-w-[40px] md:min-w-[50px] pt-1">
                     <span className="text-[17px] font-bold text-slate-800 leading-none">{day}</span>
                     <span className="text-[9px] md:text-[10px] text-slate-500 font-semibold mt-1 whitespace-nowrap">{monthTitle}</span>
                   </div>
                   
                   {/* Column 2: Event Details */}
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-1 truncate">{bk.eventType}</h3>
                     <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 text-[11px] md:text-[12px] font-medium mb-1.5 flex-wrap">
                       <span className="flex items-center gap-1 md:gap-1.5"><Clock size={12} /> {bk.eventTime}</span>
                       <span className="flex items-center gap-1 md:gap-1.5"><Users size={12} /> {bk.guestCount} khách</span>
                       {bk.room?.name && (
                         <span className="flex items-center gap-1 md:gap-1.5 text-slate-600 bg-slate-100 px-1.5 md:px-2 py-0.5 rounded-full truncate max-w-[120px]"><MapPin size={11} className="shrink-0"/> <span className="truncate">{bk.room.name}</span></span>
                       )}
                     </div>
                     <div className="flex items-center gap-1 md:gap-1.5 text-slate-500 text-[11px] md:text-[12px] truncate">
                       <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0 hidden sm:flex"><Users size={10} className="text-slate-500"/></span>
                       <span className="font-semibold text-slate-700 truncate">{bk.customerName}</span><span className="hidden sm:inline"> · {bk.customerPhone || "Chưa có SĐT"}</span>
                     </div>
                   </div>

                   {/* Column 3: Status & Price */}
                   <div className="text-right flex flex-col items-end gap-1 justify-center min-w-[70px] md:min-w-[120px] shrink-0">
                     <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] md:text-[10px] whitespace-nowrap ${displayStatusStyle}`}>{STATUS_CONFIG[bk.status]?.badgeText || bk.status}</span>
                     <span className={`font-bold mt-1 text-[11px] md:text-[13px] whitespace-nowrap ${displayPriceClass}`}>{formatPrice(bk.totalPrice || (bk.pricePerPerson ? bk.pricePerPerson * bk.guestCount : 0))}</span>
                     <span className="text-[10px] md:text-[11px] font-semibold text-amber-500">{daysText}</span>
                   </div>
                 </div>
               );
             })}
             
             {list.length === 0 && (
               <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                 <CalendarDays size={48} className="mb-4 opacity-50" />
                 <p className="font-medium">Không có dữ liệu trong tháng {filterMonth}</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* ─── TAB 1: DANH SÁCH ─── */}
      {activeTab === "list" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex gap-2 w-full md:w-auto">
              <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm" />
              <select value={filterRoom} onChange={e => { setFilterRoom(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm max-w-[150px]">
                <option value="">Tất cả phòng</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 border rounded-md text-sm">
                <option value="">Tất cả TT</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tên khách, SĐT..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-md" />
              </div>
              <button onClick={() => setExportModalOpen(true)} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium text-sm rounded-md"><Download size={16} /> Xuất Excel</button>
              <button onClick={() => { setModalInitRoom(""); setModalInitDate(""); setModalBanquet(null); setModalOpen(true); }} className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm rounded-md shadow-sm"><Plus size={16} /> Thêm đặt tiệc</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase">
                <tr>
                  <th className="px-3 py-3">Booking ID</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">SĐT KH</th>
                  <th className="px-3 py-3">Đơn vị</th>
                  <th className="px-3 py-3 text-center">Khách</th>
                  <th className="px-3 py-3">Ngày & Giờ</th>
                  <th className="px-3 py-3">Dịch vụ</th>
                  <th className="px-3 py-3 text-center">Trạng thái</th>
                  <th className="px-3 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 bg-white">
                    <td className="px-3 py-3"><span onClick={() => { setModalBanquet(b); setModalOpen(true); }} className="font-mono text-indigo-600 hover:underline cursor-pointer font-medium">{b.bookingId}</span></td>
                    <td className="px-3 py-3 font-semibold text-slate-800">{b.customerName}</td>
                    <td className="px-3 py-3 text-slate-600">{b.customerPhone || "—"}</td>
                    <td className="px-3 py-3 text-slate-600 max-w-[120px] truncate">{b.companyName || "—"}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700">{b.guestCount}</td>
                    <td className="px-3 py-3"><div className="font-semibold">{formatDate(b.eventDate).slice(0, 5)}</div><div className="text-xs text-slate-500">{b.eventTime}</div></td>
                    <td className="px-3 py-3 text-xs text-slate-600 max-w-[150px] truncate" title={b.additionalServices.join(", ")}>{b.additionalServices.length > 0 ? b.additionalServices.join(", ") : "—"}</td>
                    <td className="px-3 py-3 text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_CONFIG[b.status]?.color}`}>{STATUS_CONFIG[b.status]?.badgeText || b.status}</span></td>
                    <td className="px-3 py-3 text-right"><button onClick={() => { setModalBanquet(b); setModalOpen(true); }} className="text-blue-600 font-medium text-xs px-2 py-1 bg-blue-50 rounded">Sửa</button></td>
                  </tr>
                ))}
                {list.length === 0 && (<tr><td colSpan={9} className="py-12 text-center text-slate-500">Không tìm thấy dữ liệu.</td></tr>)}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm bg-slate-50">
              <span className="text-slate-500">Tổng: <b>{total}</b> bản ghi</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border bg-white rounded-md disabled:opacity-50">Trước</button>
                <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)} className="px-3 py-1 border bg-white rounded-md disabled:opacity-50">Sau</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TIMELINE ─── */}
      {activeTab === "timeline" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between bg-white px-5 py-4 border border-slate-200 rounded-xl shadow-sm mb-4">
            <h2 className="font-bold text-slate-800">Sơ đồ phòng ăn</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(); setTimelineMonth(d.getMonth() + 1); setTimelineYear(d.getFullYear()); }} className="px-3 py-1.5 text-sm bg-slate-100 font-medium rounded-md mr-4">Tháng này</button>
              <button onClick={() => { if (timelineMonth === 1) { setTimelineMonth(12); setTimelineYear(y => y-1); } else setTimelineMonth(m => m-1); }}><ChevronLeft size={20} /></button>
              <span className="font-semibold text-slate-700 min-w-[120px] text-center">Tháng {timelineMonth}/{timelineYear}</span>
              <button onClick={() => { if (timelineMonth === 12) { setTimelineMonth(1); setTimelineYear(y => y+1); } else setTimelineMonth(m => m+1); }}><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white z-20 w-44 min-w-[176px] border border-slate-200 p-3 text-left shadow-sm">Phòng / Sảnh</th>
                    {timelineDays.map(d => {
                      const dateObj = new Date(timelineYear, timelineMonth - 1, d);
                      const isToday = dateObj.toDateString() === new Date().toDateString();
                      return (
                        <th key={d} className={`border border-slate-200 min-w-[100px] border-b-2 ${isToday ? "bg-amber-100" : [0, 6].includes(dateObj.getDay()) ? "bg-slate-100" : "bg-slate-50"}`}>
                          <div className={`text-[10px] font-medium mt-2 ${[0,6].includes(dateObj.getDay()) ? "text-red-500" : "text-slate-500"}`}>{["CN","T2","T3","T4","T5","T6","T7"][dateObj.getDay()]}</div>
                          <div className={`text-base mb-2 ${isToday ? "font-black text-amber-700" : "font-bold text-slate-700"}`}>{d}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timelineData.rooms.map((room, rIndex) => (
                    <tr key={room.id} className="group">
                      <td className={`sticky left-0 z-10 border border-slate-200 p-3 text-sm font-semibold shadow-sm ${rIndex % 2 === 0 ? "bg-amber-50/50" : "bg-white"}`}>
                        <div className="text-slate-800 truncate">{room.name}</div>
                        <div className="font-normal text-xs text-slate-500 mt-0.5">{room.capacity} khách</div>
                      </td>
                      {timelineDays.map(d => {
                        const dateStr = `${timelineYear}-${String(timelineMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const bks = timelineData.bookings.filter(b => b.roomId === room.id && b.eventDate.startsWith(dateStr));
                        return (
                          <td key={d} onClick={e => { if ((e.target as HTMLElement).closest('.bk-card')) return; setModalBanquet(null); setModalInitRoom(room.id); setModalInitDate(dateStr); setModalOpen(true); }} className="border border-slate-200 p-1.5 h-[80px] min-w-[100px] align-top hover:bg-blue-50/50 cursor-pointer relative">
                            <div className="flex flex-col gap-1.5 h-full relative">
                              {bks.map(bk => {
                                let bg = "bg-green-100 border-green-300 text-green-800";
                                if (bk.status === "INQUIRY" || bk.status === "QUOTED") bg = "bg-yellow-100 border-yellow-300 text-yellow-800";
                                if (bk.status === "CANCELLED") bg = "bg-red-50 border-red-200 text-red-700 line-through opacity-70";
                                if (bk.status === "COMPLETED") bg = "bg-gray-100 border-gray-300 text-gray-700";
                                return (
                                  <div key={bk.id} onClick={() => { setModalBanquet(bk); setModalOpen(true); }} className={`bk-card px-2 py-1.5 rounded-md border shadow-sm cursor-pointer hover:brightness-95 text-xs flex flex-col ${bg}`}>
                                    <div className="font-bold truncate">{bk.customerName}</div>
                                    <div className="font-medium opacity-80 mt-0.5 flex items-center justify-between"><span>{bk.eventTime}</span><span className="text-[9px] font-bold opacity-60 ml-1">{bk.guestCount} khách</span></div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: THỐNG KÊ ─── */}
      {activeTab === "stats" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border shadow-sm border-slate-200">
              <div className="text-slate-500 font-medium text-sm mb-2">Tổng tiệc tháng này</div>
              <div className="text-3xl font-display font-bold text-slate-800">{list.length}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm border-slate-200">
              <div className="text-slate-500 font-medium text-sm mb-2">Tiệc sắp tới (7 ngày)</div>
              <div className="text-3xl font-display font-bold text-blue-600">
                {list.filter(b => ["CONFIRMED", "DEPOSITED"].includes(b.status) && (new Date(b.eventDate).getTime() - Date.now())/86400000 <= 7 && (new Date(b.eventDate).getTime() - Date.now())/86400000 >= 0).length}
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm border-slate-200">
              <div className="text-slate-500 font-medium text-sm mb-2">Tỷ lệ xác nhận</div>
              <div className="text-3xl font-display font-bold text-green-600">
                {list.length > 0 ? Math.round((list.filter(b => ["CONFIRMED", "DEPOSITED", "COMPLETED"].includes(b.status)).length / list.length) * 100) : 0}%
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm border-slate-200">
              <div className="text-slate-500 font-medium text-sm mb-2">Doanh thu dự kiến</div>
              <div className="text-2xl font-display font-bold text-indigo-600 mt-1">
                {formatPrice(list.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6">Số tiệc theo phòng (Tháng này)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rooms.map(r => ({ name: r.name, value: list.filter(b => b.roomId === r.id).length })).filter(d => d.value > 0)}>
                    <XAxis dataKey="name" tick={{fontSize: 12}} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: PHÒNG / SẢNH ─── */}
      {activeTab === "rooms" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-800 text-lg">Quản lý Phòng / Sảnh Sân vườn</h2>
            <button onClick={() => { setRoomModalItem(null); setRoomModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium"><Plus size={16}/> Thêm sảnh</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-slate-500">
                <tr><th className="px-4 py-3">Tên Phòng/Sảnh</th><th className="px-4 py-3 text-center">Sức chứa</th><th className="px-4 py-3 text-right">Thao tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{r.capacity} khách</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setRoomModalItem(r); setRoomModalOpen(true); }} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded text-xs font-medium inline-flex items-center gap-1.5 hover:bg-blue-100">
                        <Edit size={14}/> Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <BanquetModal banquet={modalBanquet} initialRoomId={modalInitRoom} initialDate={modalInitDate} rooms={rooms} users={initialUsers} onClose={() => setModalOpen(false)} onSave={() => { setModalOpen(false); if (activeTab === "list") fetchList(); if (activeTab === "timeline") fetchTimeline(); }} />}
      {roomModalOpen && <RoomModal room={roomModalItem} onClose={() => setRoomModalOpen(false)} onSave={() => { setRoomModalOpen(false); fetchRooms(); }} />}
      <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} fromDate={exportFrom} setFromDate={setExportFrom} toDate={exportTo} setToDate={setExportTo} onExport={executeTimelineExport} exporting={exporting} />
    </div>
  );
}
