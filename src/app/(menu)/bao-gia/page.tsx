"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { Phone, ArrowLeft, Camera, Printer, Loader2, X } from "lucide-react";

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price).replace("₫", "đ");
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
        className="w-full h-full border border-[#C9A84C]/50 px-3 py-2 text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722] rounded-sm"
      />
      
      {showDropdown && value.length >= 2 && (
        <div className="absolute z-[100] top-[100%] left-0 right-0 mt-1 bg-white border border-[#C9A84C]/30 shadow-xl max-h-[300px] overflow-y-auto rounded-sm">
          {loading ? (
            <div className="flex items-center gap-2 p-3 text-[12px] text-[#4d3722]/60 italic font-body">
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
                    <span className="text-[10px] uppercase text-[#4d3722]/50 font-body tracking-wider">{item.category?.name || "Món ăn"}</span>
                  </div>
                  <div className="text-[11px] font-body text-[#C9A84C] font-semibold mt-0.5">
                    {formatPrice(item.price)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-[12px] text-[#4d3722]/60 italic font-body">
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
    <div className="min-h-screen bg-gray-50/50 py-4 sm:py-8 flex flex-col items-center px-2 sm:px-4">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="lazyOnload" />
      
      {/* BAO GIA PAPER EXACTLY MATCHING CART DRAWER UI */}
      <div 
        id="bao-gia-paper"
        ref={paperRef}
        className="w-full max-w-[600px] flex flex-col m-1 sm:m-2 border-[3px] border-double border-[#C9A84C]/60 relative bg-[#FAF8F5] overflow-visible pb-3"
      >
        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]/60 -mt-[1px] -ml-[1px]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#C9A84C]/60 -mt-[1px] -mr-[1px]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#C9A84C]/60 -mb-[1px] -ml-[1px]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]/60 -mb-[1px] -mr-[1px]" />

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
             <h2 className="px-5 font-display font-extrabold text-[15px] sm:text-[17px] text-[#C9A84C] tracking-[0.15em] drop-shadow-sm whitespace-nowrap title-shadow-gold text-center leading-normal">
                {titleParam ? titleParam : "THỰC ĐƠN BÁO GIÁ"}
             </h2>
             <div className="flex-1 h-px bg-[#4d3722]/20" />
          </div>
          
          <p className="font-display italic text-[11px] text-[#4d3722] mt-0.5 font-bold">
            {totalItemsCount === 0 ? "Chưa có món nào được chọn" : `Gợi ý thực đơn dành cho tối đa ${guests} khách`}
          </p>
        </div>

        {/* Content List */}
        <div className="flex-1 flex flex-col px-4 sm:px-10 pt-1 relative z-10 w-full overflow-hidden">
           <ul className="flex-1 flex flex-col gap-0 pb-2">
              {[...cartItems, ...extraItems].map((item) => (
                 <li key={(item as any).id || (item as any).menuItemId || item.name} className="flex flex-col relative group py-0 mt-0 sm:py-0.5">
                    <div className="flex justify-between items-baseline w-full gap-1.5 mt-0.5">
                      <div className="flex items-baseline gap-1.5 flex-1 min-w-0 pr-6">
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
                    {/* Xoá món (chỉ hiện mờ mờ trên góc khi chưa chụp, không in ra) */}
                    {(item as any).isManual && (
                      <button 
                        onClick={() => removeExtraItem((item as any).id)}
                        className="no-print absolute top-[30%] -translate-y-1/2 text-red-500/20 hover:text-red-500 transition-colors p-[1px] right-2"
                        title="Xoá món này"
                      >
                        <X size={9} strokeWidth={3} />
                      </button>
                    )}
                 </li>
              ))}
           </ul>
        </div>

        {/* Footer Section */}
        <div className="px-4 sm:px-10 mt-1 pt-1 pb-2 shrink-0 relative z-10 w-full">
           {/* Total Amount */}
           <div className="flex justify-between items-baseline border-t-2 border-[#4d3722] pt-2 mt-1">
              <span className="font-display font-extrabold text-[#4d3722] text-[13px] sm:text-[15px] uppercase tracking-tight">
                 Tổng Cộng
              </span>
              <span className="font-display font-black text-[#CA2026] text-[20px] sm:text-[24px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-none tracking-tight">
                 {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(finalTotal)}
              </span>
           </div>

           {/* Note (optional) */}
           {noteParam && (
             <div className="w-full mt-2 font-display italic text-[#4d3722]/80 leading-tight text-center" style={{ fontSize: "11px" }}>
                Ghi chú: {noteParam}
             </div>
           )}

           {/* Contact info */}
           <div className="mt-3 mb-1 flex flex-col items-center">
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
        </div>
      </div>
      {/* END BAO GIA PAPER */}

      {/* MANUALLY ADD ITEM FORM (NO PRINT) */}
      <div className="no-print w-full max-w-[600px] mt-6 px-1">
        <label className="block text-[11px] font-semibold text-[#4d3722] uppercase tracking-wider mb-2">Thêm món vào báo giá:</label>
        <div className="flex gap-1.5 sm:gap-2 items-stretch h-[36px]">
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
          <div className="w-[50px] sm:w-[60px] relative">
            <input 
              ref={quantityInputRef}
              type="number" 
              min={1} 
              value={inputQuantity}
              onChange={(e) => setInputQuantity(Number(e.target.value))}
              className="w-full h-full border border-[#C9A84C]/50 px-1 sm:px-2 rounded-sm text-center text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722]"
              title="Số lượng"
            />
          </div>
          <div className="w-[90px] sm:w-[120px] relative">
            <input 
              type="number" 
              placeholder="Giá..." 
              value={inputPrice}
              onChange={(e) => setInputPrice(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddExtraItem();
              }}
              className="w-full h-full border border-[#C9A84C]/50 px-2 py-2 rounded-sm text-[12px] bg-white text-[#4d3722] focus:outline-none focus:border-[#4d3722]"
              title="Đơn giá"
            />
          </div>
          <button 
            onClick={handleAddExtraItem}
            className="bg-[#4d3722] hover:bg-navy text-[#C9A84C] font-semibold tracking-widest uppercase text-[10px] sm:text-[11px] px-3 sm:px-5 flex items-center justify-center rounded-sm transition-colors shrink-0"
          >
            THÊM
          </button>
        </div>
      </div>

      {/* ACTION BUTTONS (NO PRINT) */}
      <div className="no-print w-full max-w-[600px] flex justify-between gap-3 mt-4 px-1">
         <button onClick={handleCapture} className="flex-[2] bg-[#4d3722] hover:bg-navy text-[#C9A84C] py-3 uppercase tracking-wider font-semibold text-[11px] flex items-center justify-center gap-2 rounded-sm shadow-md transition-colors">
            <Camera size={14} /> Chụp Ảnh
         </button>
         <button onClick={() => window.print()} className="flex-[1] bg-white border border-[#4d3722] text-[#4d3722] hover:bg-[#FAF8F5] py-3 uppercase tracking-wider font-semibold text-[11px] flex items-center justify-center gap-2 rounded-sm shadow-sm transition-colors">
            <Printer size={14} /> In / PDF
         </button>
      </div>
      <div className="no-print mt-6 mb-10 w-full max-w-[600px] px-1">
         <Link href="/" className="text-[#4d3722]/60 hover:text-[#4d3722] font-body text-[12px] flex items-center gap-1 w-fit transition-all">
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
