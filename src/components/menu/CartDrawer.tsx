// src/components/menu/CartDrawer.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, MessageSquare, ChevronRight, Phone } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CartDrawer() {
  const {
    isOpen, closeCart,
    items, getTotalPrice, getTotalItems,
    updateQuantity, removeItem, updateNote, addItem,
    clearCart,
  } = useCartStore();

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const handleAddCustom = () => {
    if (!customName.trim() || !customPrice) return;
    const price = parseInt(customPrice.replace(/\D/g, ""), 10);
    if (isNaN(price)) return;
    
    addItem({
      menuItemId: `custom-${Date.now()}`,
      name: customName.trim(),
      price: price,
    });
    setCustomName("");
    setCustomPrice("");
  };

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const openNote = (menuItemId: string, currentNote?: string) => {
    setEditingNoteId(menuItemId);
    setNoteInput(currentNote ?? "");
  };

  const saveNote = (menuItemId: string) => {
    updateNote(menuItemId, noteInput);
    setEditingNoteId(null);
  };

  const handleBooking = () => {
    closeCart();
    // Scroll to booking form
    setTimeout(() => {
      document.getElementById("dat-ban")?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Luxury Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 cart-backdrop"
            onClick={closeCart}
          />

          {/* Drawer Wrapper */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[95vw] sm:w-[90vw] max-w-[800px] bg-[#FAF8F5] flex flex-col shadow-2xl border-l-[12px] border-navy overflow-hidden"
          >
            {/* Quotation Frame Padding */}
            <div className="flex-1 flex flex-col m-1 sm:m-2 border-[3px] border-double border-[#C9A84C]/60 relative bg-[#FAF8F5] overflow-y-auto scrollbar-[2px]">
              
              {/* Corner ornaments */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]/60 -mt-[1px] -ml-[1px]" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C9A84C]/60 -mt-[1px] -mr-[1px]" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C9A84C]/60 -mb-[1px] -ml-[1px]" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]/60 -mb-[1px] -mr-[1px]" />

              {/* Close Button */}
              <button
                onClick={closeCart}
                className="absolute top-2 right-2 p-2 text-charcoal/20 hover:text-charcoal transition-colors z-20"
              >
                <X size={20} className="stroke-[1.5px]" />
              </button>

              {/* Header Box */}
              <div className="flex flex-col items-center pt-3 pb-1 px-4 relative z-10">
                <div className="flex flex-col items-center mb-2 text-[#4d3722]">
                  {/* Decorative Logo */}
                  <div className="relative w-8 h-8 border-[1.5px] border-[#4d3722] flex items-center justify-center rotate-45 mb-2 shadow-[0_0_15px_rgba(201,168,76,0.15)] bg-[#FAF8F5]">
                    <div className="absolute inset-0.5 border border-[#4d3722]/50" />
                    <span className="-rotate-45 font-display text-[15px] font-bold tracking-tighter">PA</span>
                  </div>
                  <p className="font-display font-bold uppercase tracking-[0.2em] text-[12px] leading-none">Phương Anh</p>
                  <p className="text-[7.5px] uppercase tracking-[0.3em] opacity-80 mt-1 font-medium leading-none">Hotel & Restaurant</p>
                </div>
                
                <div className="w-full flex items-center justify-center my-1 relative px-2">
                   <div className="flex-1 h-px bg-[#4d3722]/20" />
                   <h2 className="px-5 font-display font-extrabold text-[15px] sm:text-[17px] text-[#C9A84C] tracking-[0.15em] drop-shadow-sm whitespace-nowrap title-shadow-gold">
                      THỰC ĐƠN BÁO GIÁ
                   </h2>
                   <div className="flex-1 h-px bg-[#4d3722]/20" />
                </div>
                
                <p className="font-display italic text-[11px] text-[#4d3722] mt-0.5 font-bold">
                  {items.length === 0 ? "Chưa có món nào được chọn" : `Gợi ý thực đơn dành cho tối đa 10 khách`}
                </p>
              </div>

              {/* Content List */}
              <div className="flex-1 flex flex-col px-4 sm:px-10 pt-1 relative z-10">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#4d3722]/40 pb-6">
                    <p className="font-display text-lg mb-1 opacity-80">Trống</p>
                    <p className="text-[11px] font-light text-center px-4">Hãy thêm món từ thực đơn để lên bảng báo giá.</p>
                  </div>
                ) : (
                  <ul className="flex-1 flex flex-col gap-0 pb-2">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.li
                          key={item.menuItemId}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col relative group py-0 mt-0 sm:py-0.5"
                        >
                          <div className="flex justify-between items-baseline w-full gap-1.5 mt-0.5">
                            <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-1">
                              <span className="text-[6px] text-[#4d3722]/40 flex-shrink-0 relative -top-[2px]">⚫</span>
                              <p className="font-display font-extrabold text-[#4d3722] uppercase tracking-tight text-[11.5px] sm:text-[13.5px] leading-tight break-words">
                                {item.name}
                                {item.quantity > 1 && (
                                  <span className="lowercase font-body font-normal text-[#4d3722] ml-1.5 opacity-80 whitespace-nowrap text-[11px]">
                                    (x{item.quantity})
                                  </span>
                                )}
                              </p>
                              <div className="flex-1 border-b border-dotted border-[#4d3722]/30 opacity-60 relative min-w-[20px]" style={{ bottom: '4px' }} />
                            </div>
                            <p className="font-body font-black text-[#4d3722] text-[12.5px] sm:text-[14.5px] flex-shrink-0 tracking-tight leading-tight">
                              {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                            </p>
                          </div>
                          
                          {/* Optional Note Row */}
                          {item.note && editingNoteId !== item.menuItemId && (
                            <p className="text-[10px] italic text-[#4d3722]/60 ml-[14px] max-w-[85%] mt-0.5 leading-tight">
                              Ghi chú: {item.note}
                            </p>
                          )}
                          
                          {/* Note Input Field */}
                          {editingNoteId === item.menuItemId && (
                            <div className="ml-[14px] mt-1 mb-1">
                               <input
                                  autoFocus
                                  value={noteInput}
                                  onChange={(e) => setNoteInput(e.target.value)}
                                  onBlur={() => saveNote(item.menuItemId)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveNote(item.menuItemId);
                                    if (e.key === "Escape") setEditingNoteId(null);
                                  }}
                                  placeholder="Nhập ghi chú (không hành, ít cay...)"
                                  className="w-[90%] text-[10px] sm:text-[11px] px-2 py-1.5 font-body bg-white/70 border-b border-[#C9A84C]/50 focus:outline-none focus:border-[#4d3722] text-[#4d3722] transition-colors"
                                  maxLength={120}
                               />
                            </div>
                          )}

                          {/* Action Controls (Discreet - safe to screenshot) */}
                          <div className="flex items-center gap-[12px] ml-[14px] mt-0 mb-0.5 opacity-20 group-hover:opacity-100 focus-within:opacity-100 focus-within:flex transition-opacity h-3">
                             <div className="flex items-center gap-1.5">
                                <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="text-lg leading-none text-[#4d3722] hover:text-[#C9A84C]">−</button>
                                <span className="font-mono text-[9px] font-bold text-[#4d3722] w-2 text-center relative top-[0.5px]">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="text-[14px] leading-none text-[#4d3722] hover:text-[#C9A84C] relative -top-[0.5px]">+</button>
                             </div>
                             <div className="w-[1px] h-2.5 bg-[#4d3722]/20" />
                             <button onClick={() => openNote(item.menuItemId, item.note)} className="text-[#4d3722] hover:text-[#C9A84C]"><MessageSquare size={9} strokeWidth={2.5} /></button>
                             <button onClick={() => removeItem(item.menuItemId)} className="text-[#8b2323] hover:text-red-500"><Trash2 size={9} strokeWidth={2.5} /></button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              {/* Footer Section */}
              <div className="px-4 sm:px-10 mt-auto pt-1 pb-2 shrink-0 relative z-10 w-full">
                {items.length > 0 && (
                  <>
                    {/* Total Amount */}
                    <div className="flex justify-between items-baseline border-t-2 border-[#4d3722] pt-2 mt-1">
                      <span className="font-display font-extrabold text-[#4d3722] text-[13px] sm:text-[15px] uppercase tracking-tight">
                        Tổng Cộng
                      </span>
                      <span className="font-display font-black text-[#CA2026] text-[20px] sm:text-[24px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-none tracking-tight">
                        {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(totalPrice)}
                      </span>
                    </div>

                    {/* Contact Info (For Screenshot) */}
                    <div className="mt-3 mb-2 flex flex-col items-center">
                      <p className="font-display font-bold italic text-[#4d3722]/90 text-[13px] sm:text-[14px] mb-1.5 tracking-wide">Chúc Quý khách ngon miệng</p>
                      <div className="flex items-center justify-center gap-6 text-[11px] sm:text-[13px] font-body text-[#4d3722] font-semibold tracking-wide flex-wrap">
                         <span className="flex items-center gap-1.5">
                            <Phone size={13} className="stroke-[2.5px]" /> 
                            Zalo: 0839.881.881
                         </span>
                         <span className="flex items-center gap-1.5">
                            <Phone size={13} className="stroke-[2.5px]" /> 
                            Lễ tân: 0208.656.9999
                         </span>
                      </div>
                    </div>
                  </>
                )}

                {/* UI Action Buttons (Hide in standard Zalo crop visually or use tools) */}
                <div className={`pt-4 mt-2 ${items.length > 0 ? 'border-t border-[#4d3722]/10' : ''} space-y-2 relative`} data-html2canvas-ignore="true">
                  
                  {/* CUSTOM MENU INPUT */}
                  <div className="flex gap-1.5 mb-3">
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Tên món (VD: Bò sốt tiêu)"
                      className="flex-1 border border-[#4d3722]/20 text-[11px] px-2 py-1.5 rounded-sm bg-white focus:outline-none focus:border-navy"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustom();
                      }}
                    />
                    <input
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="Giá (VD: 350000)"
                      type="number"
                      className="w-[90px] border border-[#4d3722]/20 text-[11px] px-2 py-1.5 rounded-sm bg-white focus:outline-none focus:border-navy"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddCustom();
                      }}
                    />
                    <button
                      onClick={handleAddCustom}
                      className="bg-[#4d3722] text-[#C9A84C] font-semibold px-3 py-1.5 text-[10px] uppercase rounded-sm hover:bg-navy transition-colors shrink-0"
                    >
                      Thêm
                    </button>
                  </div>

                  {items.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                       <button
                         onClick={handleBooking}
                         className="w-full bg-[#4d3722] hover:bg-navy text-[#C9A84C] py-2.5 uppercase tracking-widest font-semibold text-[10px] transition-all flex items-center justify-center gap-1 rounded-sm shadow-md"
                       >
                         Xác Nhận Đặt Bàn <ChevronRight size={12} />
                       </button>
                       <div className="flex gap-2">
                          <button
                             onClick={() => { closeCart(); window.location.href='/bao-gia?guests=10'; }}
                             className="flex-[1] py-2 text-[9px] uppercase tracking-wider font-semibold text-white bg-[#4d3722]/90 hover:bg-navy transition-colors flex items-center justify-center gap-1.5 rounded-sm min-h-[36px]"
                          >
                             📋 Xem Báo Giá
                          </button>
                          <button
                             onClick={() => {
                                alert("Mẹo chụp màn hình:\nBấm phím nguồn + giảm âm lượng (hoặc PrtSc trên máy tính).\nẢnh này được tối ưu giống y hệt tờ Menu in của nhà hàng.");
                             }}
                             className="flex-[1] py-2 text-[9px] uppercase tracking-wider font-semibold text-[#4d3722] border border-[#4d3722]/20 hover:bg-[#4d3722]/5 transition-colors flex items-center justify-center gap-1.5 rounded-sm min-h-[36px]"
                          >
                             📸 Chụp Ảnh
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
