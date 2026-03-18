"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { Phone, ArrowLeft, Camera, Printer, Loader2, X } from "lucide-react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

// ============== CUSTOM HOOK: useFoodSearch ==============
const useFoodSearch = (query: string) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (query.trim().length < 2) { 
      setResults([]); 
      return; 
    }
    
    // 300ms debounce
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/menu?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error("API lỗi");
        const json = await res.json();
        setResults(json.data?.slice(0, 6) || []);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  return { results, loading };
};

// ============== COMPONENT: AutocompleteInput ==============
function AutocompleteInput({ 
  value,
  onChange,
  onSelect 
}: { 
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: { name: string, price: number }) => void 
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { results, loading } = useFoodSearch(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelect = (item: any) => {
    onChange(item.name);
    setShowDropdown(false);
    onSelect({ name: item.name, price: item.price });
  };

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <input
        type="text"
        placeholder="Tên món (gõ để tìm)..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        className="w-full h-full border border-[#C9A84C]/50 px-3 py-2 text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722]"
      />
      
      {showDropdown && value.length >= 2 && (
        <div className="absolute z-[100] top-[100%] left-0 right-0 mt-1 bg-white border border-[#C9A84C]/30 shadow-xl max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-[12px] text-[#4d3722]/60 italic font-ui">
              <Loader2 size={14} className="animate-spin" /> Đang tìm...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((item, idx) => (
                <li 
                  key={item._id || item.menuItemId || idx}
                  className={`px-3 py-2 cursor-pointer border-b border-[#FAF8F5] last:border-0 transition-colors
                    ${selectedIndex === idx ? "bg-[#C9A84C]/10" : "hover:bg-[#C9A84C]/10"}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-[#4d3722] text-[13px] font-display">{item.name}</span>
                    <span className="text-[10px] uppercase text-[#4d3722]/50 font-ui tracking-wider">{item.category?.name || "Món ăn"}</span>
                  </div>
                  <div className="text-[11px] font-ui text-[#C9A84C] font-semibold mt-0.5">
                    {formatPrice(item.price)}đ
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-[12px] text-[#4d3722]/60 italic font-ui">
              Không tìm thấy món — nhập thủ công vẫn được
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============== MAIN PAGE CONTENT ==============
function BaoGiaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items: cartItems, getTotalPrice: getCartTotal } = useCartStore();
  const paperRef = useRef<HTMLDivElement>(null);

  const guests = searchParams.get("guests") || "10";
  const titleParam = searchParams.get("title");
  const noteParam = searchParams.get("note");

  const [mounted, setMounted] = useState(false);
  
  const [extraItems, setExtraItems] = useState<Array<{
    id: string; 
    name: string;
    quantity: number; 
    price: number;
    isManual: boolean;
  }>>([]);

  const [inputName, setInputName] = useState("");
  const [inputQuantity, setInputQuantity] = useState<number>(1);
  const [inputPrice, setInputPrice] = useState<number | "">("");

  const quantityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const totalItemsCount = cartItems.length + extraItems.length;

  if (totalItemsCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FAF8F5]">
        <p className="font-display text-xl text-[#4d3722] mb-4">Chưa có món nào được chọn</p>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-[#4d3722] text-[#C9A84C] uppercase tracking-wider font-semibold text-sm rounded-sm"
        >
          <ArrowLeft size={16} /> Quay lại chọn món
        </Link>
      </div>
    );
  }

  const categorized = cartItems.reduce((acc, item) => {
    const cat = (item as any).category || "MÓN ĐÃ CHỌN";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof cartItems>);

  const handleCapture = async () => {
    if (!paperRef.current) return;
    try {
      if (typeof window !== 'undefined' && (window as any).html2canvas) {
        const canvas = await (window as any).html2canvas(paperRef.current, { scale: 2, useCORS: true });
        const image = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = image;
        a.download = `bao-gia-phuonganh-${Date.now()}.png`;
        a.click();
      } else {
        alert("Đang tải công cụ chụp ảnh, vui lòng bấm lại sau 1-2 giây!");
      }
    } catch(err) {
      console.error("Lỗi khi chụp:", err);
      alert("Có lỗi xảy ra khi tạo ảnh.");
    }
  };

  const today = new Date();
  const dateString = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth()+1).toString().padStart(2, '0')}/${today.getFullYear()}`;

  const handleAddExtraItem = () => {
    if (!inputName.trim() || inputPrice === "" || inputQuantity < 1) return;
    setExtraItems(prev => [
      ...prev,
      {
        id: `extra-${Date.now()}`,
        name: inputName.trim(),
        price: Number(inputPrice),
        quantity: Number(inputQuantity),
        isManual: true
      }
    ]);
    setInputName("");
    setInputPrice("");
    setInputQuantity(1);
  };

  const removeExtraItem = (id: string) => {
    setExtraItems(prev => prev.filter(item => item.id !== id));
  };

  const totalExtraPrice = extraItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const finalTotal = getCartTotal() + totalExtraPrice;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8 flex flex-col items-center scrollbar-thin">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      {/* Paper Container */}
      <div 
        id="bao-gia-paper"
        ref={paperRef}
        className="bg-white border-[2px] border-[#C9A84C] relative shadow-2xl mx-auto flex flex-col pt-10 pb-10 px-12"
        style={{
          width: "100%", maxWidth: "595px", // A4 width at 72dpi
          minHeight: "842px", // A4 height 
          color: "#1a1a1a",
          boxSizing: "border-box"
        }}
      >
        <div className="absolute inset-0 border-[2px] border-[#C9A84C] pointer-events-none" style={{ margin: "2px" }} />

        {/* Header */}
        <div className="flex flex-col items-center mb-6 mt-2">
          <svg width="60" height="60" viewBox="0 0 100 100" className="mb-2">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="#FAF8F5" stroke="#4d3722" strokeWidth="2"/>
             <path d="M50 4 L96 50 L50 96 L4 50 Z" fill="none" stroke="#4d3722" strokeWidth="1" opacity="0.5"/>
             <text x="50" y="56" fontFamily="Cormorant Garamond" fontSize="28" fontWeight="bold" fill="#4d3722" textAnchor="middle">PA</text>
          </svg>
          <div className="font-display font-bold uppercase tracking-[0.3em] text-[#4d3722]" style={{ fontSize: "18px", lineHeight: "1" }}>PHƯƠNG ANH</div>
          <div className="uppercase tracking-[0.3em] font-medium text-[#4d3722]/60" style={{ fontSize: "10px", marginTop: "4px" }}>HOTEL & RESTAURANT</div>
          
          <div className="w-full flex items-center justify-center mt-6 mb-2 relative px-4">
             <div className="flex-1 h-px bg-[#C9A84C]" />
             <h2 className="px-6 font-display font-bold text-[#C9A84C] tracking-[0.1em] uppercase whitespace-nowrap" style={{ fontSize: "16px" }}>
                {titleParam ? titleParam : "THỰC ĐƠN BÁO GIÁ"}
             </h2>
             <div className="flex-1 h-px bg-[#C9A84C]" />
          </div>
        </div>

        {/* Info row */}
        <div className="flex justify-between w-full mb-6 font-ui" style={{ fontSize: "11px", color: "#666" }}>
          <div>Ngày lập: {dateString}</div>
          <div>Số khách: {guests}</div>
        </div>

        {/* Items Container */}
        <div className="flex-1 w-full flex flex-col gap-5">
           
           {/* Cart Items Mapping */}
           {Object.keys(categorized).map((catName) => (
             <div key={catName} className="flex flex-col">
                <div className="w-full text-center font-display font-bold text-[#C9A84C] uppercase tracking-[0.15em] mb-2" style={{ fontSize: "10px" }}>
                   ── {catName} ──
                </div>
                <div className="flex flex-col">
                  {categorized[catName].map((item: any) => (
                    <div key={item.menuItemId} className="flex justify-between items-end border-b border-dashed border-[#e8e0d0] relative group" style={{ padding: "5px 0", fontSize: "12px", lineHeight: "1.3" }}>
                       <div className="flex items-baseline pr-4 w-[60%]" style={{ fontFamily: "Cormorant Garamond" }}>
                          <span className="mr-2 text-[#C9A84C]" style={{ fontSize: "8px", verticalAlign: "middle" }}>•</span>
                          <span className="font-bold text-[#4d3722] uppercase tracking-wide truncate">{item.name}</span>
                       </div>
                       <div className="font-ui text-right whitespace-nowrap flex-1" style={{ color: "#4d3722" }}>
                          {item.quantity} × {formatPrice(item.price)} = <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           ))}

           {/* Manually Added Items */}
           {extraItems.length > 0 && (
             <div className="flex flex-col mt-2">
                <div className="w-full text-center font-display font-bold text-[#C9A84C] uppercase tracking-[0.15em] mb-2" style={{ fontSize: "10px" }}>
                   ── MÓN YÊU CẦU THÊM ──
                </div>
                <div className="flex flex-col">
                  {extraItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-end border-b border-dashed border-[#e8e0d0] relative group pr-6" style={{ padding: "5px 0", fontSize: "12px", lineHeight: "1.3" }}>
                       <div className="flex items-baseline pr-4 w-[60%] relative" style={{ fontFamily: "Cormorant Garamond" }}>
                          <span className="mr-1.5 text-[#C9A84C]" style={{ fontSize: "8px", verticalAlign: "middle" }}>✏️</span>
                          <span className="font-bold text-[#4d3722] uppercase tracking-wide truncate">{item.name}</span>
                       </div>
                       <div className="font-ui text-right whitespace-nowrap flex-1" style={{ color: "#4d3722" }}>
                          {item.quantity} × {formatPrice(item.price)} = <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                       </div>
                       {/* Delete Button (No-print) */}
                       <button 
                         onClick={() => removeExtraItem(item.id)}
                         className="no-print absolute right-0 top-1/2 -translate-y-1/2 text-red-500/30 hover:text-red-600 transition-colors p-1 opacity-0 group-hover:opacity-100"
                         title="Xoá món này"
                       >
                         <X size={12} strokeWidth={3} />
                       </button>
                    </div>
                  ))}
                </div>
             </div>
           )}

        </div>

        {/* Note (optional) */}
        {noteParam && (
           <div className="w-full mt-4 font-body italic" style={{ fontSize: "12px", color: "#666" }}>
              Ghi chú: {noteParam}
           </div>
        )}

        {/* Footer Sum */}
        <div className="w-full mt-8 pt-4 border-t border-[#C9A84C] flex flex-col items-end">
           <div className="flex justify-end items-baseline w-full mt-2">
              <span className="font-display font-bold text-[#4d3722] uppercase mr-4" style={{ fontSize: "16px" }}>TỔNG CỘNG:</span>
              <span className="font-ui font-bold text-[#C9A84C]" style={{ fontSize: "18px" }}>{formatPrice(finalTotal)} VNĐ</span>
           </div>
           <div className="font-ui italic mt-1" style={{ fontSize: "10px", color: "#888" }}>*Giá đã bao gồm VAT</div>
        </div>

        {/* Contact info */}
        <div className="w-full mt-10 mb-2 flex flex-col items-center">
           <div className="font-display font-bold italic text-[#4d3722] mb-3" style={{ fontSize: "14px" }}>Chúc Quý khách ngon miệng</div>
           <div className="flex items-center gap-6 font-ui font-semibold text-[#4d3722]" style={{ fontSize: "10px" }}>
              <span className="flex items-center gap-1.5"><Phone size={10} strokeWidth={2.5}/> Zalo: 0839.881.881</span>
              <span className="flex items-center gap-1.5"><Phone size={10} strokeWidth={2.5}/> Lễ tân: 0208.656.9999</span>
           </div>
        </div>
      </div>

      {/* MANUALLY ADD ITEM FORM (NO PRINT) */}
      <div className="no-print w-full max-w-[595px] mt-8 px-4 font-ui">
        <label className="block text-[11px] font-semibold text-[#4d3722] uppercase tracking-wider mb-2">Thêm món vào báo giá:</label>
        <div className="flex gap-2 items-stretch h-[36px]">
          <div className="flex-1 bg-white relative">
            <AutocompleteInput 
               value={inputName}
               onChange={setInputName}
               onSelect={(item) => {
                 setInputName(item.name);
                 setInputPrice(item.price);
                 quantityInputRef.current?.focus();
               }}
            />
          </div>
          <div className="w-[60px] relative">
            <input 
              ref={quantityInputRef}
              type="number" 
              min={1} 
              value={inputQuantity}
              onChange={(e) => setInputQuantity(Number(e.target.value))}
              className="w-full h-full border border-[#C9A84C]/50 px-2 text-center text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722]"
              title="Số lượng"
            />
          </div>
          <div className="w-[120px] relative">
            <input 
              type="number" 
              placeholder="Giá (VD: 550000)" 
              value={inputPrice}
              onChange={(e) => setInputPrice(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddExtraItem();
              }}
              className="w-full h-full border border-[#C9A84C]/50 px-3 py-2 text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722]"
              title="Đơn giá"
            />
          </div>
          <button 
            onClick={handleAddExtraItem}
            className="bg-[#4d3722] hover:bg-navy text-[#C9A84C] font-semibold tracking-widest uppercase text-[11px] px-5 flex items-center justify-center transition-colors"
          >
            THÊM
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS (NO PRINT) */}
      <div className="no-print w-full max-w-[595px] flex justify-between gap-3 mt-4 px-4">
         <button onClick={handleCapture} className="flex-[2] bg-[#4d3722] hover:bg-navy text-[#C9A84C] py-3 uppercase tracking-wider font-semibold text-[11px] flex items-center justify-center gap-2 rounded-sm shadow-md transition-colors">
            <Camera size={14} /> Chụp Ảnh
         </button>
         <button onClick={() => window.print()} className="flex-[1] bg-white border border-[#4d3722] text-[#4d3722] hover:bg-[#FAF8F5] py-3 uppercase tracking-wider font-semibold text-[11px] flex items-center justify-center gap-2 rounded-sm shadow-sm transition-colors">
            <Printer size={14} /> In / PDF
         </button>
      </div>
      <div className="no-print mt-6 mb-10">
         <Link href="/" className="text-[#4d3722]/60 hover:text-[#4d3722] font-ui text-[12px] flex items-center gap-1 border-b border-transparent hover:border-[#4d3722] pb-0.5 transition-all">
            <ArrowLeft size={12} /> Quay lại thực đơn
         </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] p-8 text-center text-[#4d3722]">Đang tải...</div>}>
      <BaoGiaContent />
    </Suspense>
  );
}
