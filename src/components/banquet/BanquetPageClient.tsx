// src/components/banquet/BanquetPageClient.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  PartyPopper, Users, CalendarDays, Phone, User,
  Building2, Utensils, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Info, Star, Sparkles, Crown,
  MapPin, Maximize2, Wrench,
} from "lucide-react";

const getRoomImage = (roomName: string): string => {
  const name = roomName.toLowerCase();
  if (name.includes('vip') || name.includes('sen')) return '/spaces/phong-vip.jpg';
  if (name.includes('vÆ°á»n') || name.includes('ngoÃ i trá»i') || name.includes('sÃ¢n')) return '/spaces/san-vuon.jpg';
  if (name.includes('tiá»‡c') || name.includes('cÆ°á»›i') || name.includes('sáº£nh') || name.includes('há»™i')) return '/spaces/sanh-tiec.jpg';
  return '/spaces/bar-lounge.jpg';
};

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerDay: number | null;
  equipment: string[];
  images: string[];
  description: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: { name: string; slug: string };
  imageUrl: string | null;
}

// â”€â”€â”€ Set Menu Tiers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SET_MENU_TIERS = [
  {
    id: "A",
    label: "Set A",
    icon: Star,
    pricePerPerson: 500_000,
    color: "border-amber-300 bg-amber-50",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-400",
    badgeColor: "bg-amber-500",
    dishes: 6,
    description: "Tiá»‡c cÆ¡ báº£n â€” 6 mÃ³n chá»n lá»c",
    includes: ["2 mÃ³n khai vá»‹", "2 mÃ³n chÃ­nh", "1 mÃ³n cÆ¡m/bÃºn", "TrÃ¡ng miá»‡ng"],
  },
  {
    id: "B",
    label: "Set B",
    icon: Sparkles,
    pricePerPerson: 800_000,
    color: "border-jade/30 bg-jade-light",
    activeColor: "border-jade bg-jade-light ring-2 ring-jade",
    badgeColor: "bg-jade",
    dishes: 8,
    description: "Tiá»‡c nÃ¢ng cao â€” 8 mÃ³n cao cáº¥p",
    includes: ["3 mÃ³n khai vá»‹", "3 mÃ³n chÃ­nh", "1 mÃ³n láº©u/nÆ°á»›ng", "CÆ¡m + TrÃ¡ng miá»‡ng"],
  },
  {
    id: "C",
    label: "Set C",
    icon: Crown,
    pricePerPerson: 1_200_000,
    color: "border-terra/30 bg-terra-light",
    activeColor: "border-terra bg-terra-light ring-2 ring-terra",
    badgeColor: "bg-terra",
    dishes: 10,
    description: "Tiá»‡c VIP â€” 10 mÃ³n + Ä‘á»“ uá»‘ng",
    includes: ["4 mÃ³n khai vá»‹", "3 mÃ³n chÃ­nh háº£i sáº£n", "Láº©u Ä‘áº·c biá»‡t", "CÆ¡m + TrÃ¡ng miá»‡ng + Äá»“ uá»‘ng"],
  },
  {
    id: "custom",
    label: "Tá»± chá»n",
    icon: Utensils,
    pricePerPerson: 0,
    color: "border-gray-200 bg-gray-50",
    activeColor: "border-gray-400 bg-gray-100 ring-2 ring-gray-400",
    badgeColor: "bg-gray-500",
    dishes: 0,
    description: "Tá»± chá»n tá»«ng mÃ³n theo Ã½ muá»‘n",
    includes: [],
  },
];

const EVENT_TYPES = [
  "Tiá»‡c cÆ°á»›i", "Tiá»‡c sinh nháº­t", "Tiá»‡c thÃ´i nÃ´i",
  "Há»™i nghá»‹ / Há»™i tháº£o", "LiÃªn hoan cÃ´ng ty",
  "Gáº·p máº·t gia Ä‘Ã¬nh", "Tiá»‡c táº¥t niÃªn / tÃ¢n niÃªn",
  "Sá»± kiá»‡n khÃ¡c",
];

const EQUIPMENT_ICONS: Record<string, string> = {
  projector: "ðŸ“½ï¸", microphone: "ðŸŽ¤", ac: "â„ï¸",
  sound: "ðŸ”Š", lighting: "ðŸ’¡", stage: "ðŸŽ­",
  wifi: "ðŸ“¶", parking: "ðŸ…¿ï¸",
};

// â”€â”€â”€ Form Schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FormSchema = z.object({
  customerName: z.string().min(2, "TÃªn tá»‘i thiá»ƒu 2 kÃ½ tá»±"),
  customerPhone: z.string().regex(/^(0|\+84)[0-9]{8,10}$/, "SÄT khÃ´ng há»£p lá»‡"),
  customerEmail: z.string().email("Email khÃ´ng há»£p lá»‡").optional().or(z.literal("")),
  eventType: z.string().min(1, "Vui lÃ²ng chá»n loáº¡i sá»± kiá»‡n"),
  eventDate: z.string().min(1, "Vui lÃ²ng chá»n ngÃ y"),
  eventTime: z.string().min(1, "Vui lÃ²ng chá»n giá»"),
  guestCount: z.coerce.number().min(10, "Tá»‘i thiá»ƒu 10 khÃ¡ch").max(1000),
  roomId: z.string().optional(),
  note: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND", maximumFractionDigits: 0,
  }).format(n);
}

// â”€â”€â”€ Room Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RoomCard({
  room, selected, onSelect,
}: {
  room: Room; selected: boolean; onSelect: () => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const roomDisplayImage = room.images[0] || getRoomImage(room.name);

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${
        selected
          ? "border-jade ring-2 ring-jade/30 shadow-lg"
          : "border-[rgb(var(--border))] hover:border-jade/40 hover:shadow-md"
      }`}
    >
      {/* Image */}
      <div className="relative h-36 bg-jade-light">
        {roomDisplayImage ? (
          <Image src={roomDisplayImage} alt={room.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl opacity-20">ðŸ›ï¸</div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 bg-jade text-white rounded-full p-1">
            <CheckCircle2 size={16} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-ink text-sm">{room.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
          <span className="flex items-center gap-1">
            <Users size={12} />
            Tá»‘i Ä‘a {room.capacity} khÃ¡ch
          </span>
          {room.pricePerDay && (
            <span className="flex items-center gap-1 text-terra font-semibold">
              {formatPrice(room.pricePerDay)}/ngÃ y
            </span>
          )}
        </div>

        {/* Equipment */}
        {room.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {room.equipment.slice(0, showMore ? undefined : 4).map((eq) => (
              <span key={eq} className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full text-muted-foreground">
                {EQUIPMENT_ICONS[eq] ?? "âœ“"} {eq}
              </span>
            ))}
            {!showMore && room.equipment.length > 4 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowMore(true); }}
                className="text-[11px] text-jade underline"
              >
                +{room.equipment.length - 4} thÃªm
              </button>
            )}
          </div>
        )}

        {room.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{room.description}</p>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ Set Menu Tier Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SetMenuCard({
  tier, selected, guestCount, onSelect,
}: {
  tier: (typeof SET_MENU_TIERS)[0];
  selected: boolean;
  guestCount: number;
  onSelect: () => void;
}) {
  const Icon = tier.icon;
  const total = tier.pricePerPerson * guestCount;

  return (
    <div
      onClick={onSelect}
      className={`relative rounded-2xl border-2 cursor-pointer transition-all p-5 ${
        selected ? tier.activeColor : tier.color + " hover:shadow-md"
      }`}
    >
      {selected && (
        <CheckCircle2
          size={18}
          className="absolute top-3 right-3 text-jade"
        />
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 ${tier.badgeColor} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-ink text-sm">{tier.label}</p>
          <p className="text-xs text-muted-foreground">{tier.description}</p>
        </div>
      </div>

      {tier.pricePerPerson > 0 && (
        <p className="font-display text-xl font-bold text-jade mb-1">
          {formatPrice(tier.pricePerPerson)}
          <span className="text-xs font-normal text-muted-foreground font-body"> /ngÆ°á»i</span>
        </p>
      )}

      {tier.pricePerPerson > 0 && guestCount >= 10 && (
        <p className="text-xs font-semibold text-terra mb-3">
          â‰ˆ {formatPrice(total)} cho {guestCount} khÃ¡ch
        </p>
      )}

      {tier.includes.length > 0 && (
        <ul className="space-y-1">
          {tier.includes.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 bg-jade rounded-full flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {tier.id === "custom" && (
        <p className="text-xs text-muted-foreground">
          Báº¡n sáº½ chá»n tá»«ng mÃ³n Äƒn phÃ¹ há»£p vá»›i ngÃ¢n sÃ¡ch riÃªng
        </p>
      )}
    </div>
  );
}

// â”€â”€â”€ Custom Menu Picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CustomMenuPicker({
  menuItems,
  selected,
  onChange,
}: {
  menuItems: MenuItem[];
  selected: Map<string, number>;
  onChange: (id: string, qty: number) => void;
}) {
  const [openCat, setOpenCat] = useState<string | null>(null);

  // Group by category
  const grouped = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category.name;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalCustom = Array.from(selected.entries()).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item?.price ?? 0) * qty;
  }, 0);

  return (
    <div className="mt-4 space-y-2">
      {totalCustom > 0 && (
        <div className="bg-jade-light rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-jade font-medium">
            {selected.size} mÃ³n Ä‘Ã£ chá»n
          </span>
          <span className="font-bold text-jade price-tag">
            {formatPrice(totalCustom)}
          </span>
        </div>
      )}

      {Object.entries(grouped).map(([catName, items]) => {
        const isOpen = openCat === catName;
        const selectedInCat = items.filter((i) => (selected.get(i.id) ?? 0) > 0).length;

        return (
          <div key={catName} className="border border-[rgb(var(--border))] rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenCat(isOpen ? null : catName)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink">{catName}</span>
                {selectedInCat > 0 && (
                  <span className="text-xs bg-jade text-white px-2 py-0.5 rounded-full">
                    {selectedInCat} mÃ³n
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
              <div className="divide-y divide-gray-50">
                {items.map((item) => {
                  const qty = selected.get(item.id) ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-2.5 bg-white"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.imageUrl ? (
                          <div className="w-12 h-12 relative rounded-xl overflow-hidden shrink-0 border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-jade-light flex items-center justify-center text-base flex-shrink-0">ðŸ½ï¸</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                          <p className="text-xs text-terra font-semibold price-tag">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>

                      {/* Qty control */}
                      <div className="flex items-center gap-2 ml-3">
                        {qty > 0 ? (
                          <>
                            <button
                              onClick={() => onChange(item.id, qty - 1)}
                              className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 font-bold text-lg leading-none"
                            >
                              âˆ’
                            </button>
                            <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                            <button
                              onClick={() => onChange(item.id, qty + 1)}
                              className="w-7 h-7 rounded-lg bg-jade text-white flex items-center justify-center hover:bg-jade-mid font-bold text-lg leading-none"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onChange(item.id, 1)}
                            className="text-xs font-semibold px-3 py-1.5 border border-jade/40 text-jade rounded-lg hover:bg-jade-light transition-colors"
                          >
                            ThÃªm
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€â”€ Main Page Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BanquetPageClient({
  rooms,
  menuItems,
}: {
  rooms: Room[];
  menuItems: MenuItem[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [customMenu, setCustomMenu] = useState<Map<string, number>>(new Map());
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { guestCount: 50 },
  });

  const guestCount = watch("guestCount") || 50;
  const selectedRoomId = watch("roomId");

  const handleCustomMenuChange = (id: string, qty: number) => {
    setCustomMenu((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(id);
      else next.set(id, qty);
      return next;
    });
  };

  // TÃ­nh bÃ¡o giÃ¡
  const tier = SET_MENU_TIERS.find((t) => t.id === selectedTier);
  const estimatedTotal =
    tier?.id === "custom"
      ? Array.from(customMenu.entries()).reduce((s, [id, qty]) => {
          const item = menuItems.find((m) => m.id === id);
          return s + (item?.price ?? 0) * qty;
        }, 0)
      : (tier?.pricePerPerson ?? 0) * guestCount;

  const onSubmit = async (data: FormValues) => {
    try {
      const menuSet =
        selectedTier === "custom"
          ? Array.from(customMenu.entries()).map(([id, qty]) => {
              const item = menuItems.find((m) => m.id === id)!;
              return {
                menuItemId: id,
                name: item.name,
                quantity: qty,
                unitPrice: item.price,
              };
            })
          : tier
          ? [{ menuItemId: "", name: tier.label, quantity: 1, unitPrice: tier.pricePerPerson }]
          : [];

      const eventDatetime = new Date(`${data.eventDate}T${data.eventTime}:00`);

      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        eventType: data.eventType,
        eventDate: eventDatetime.toISOString(),
        eventTime: data.eventTime,
        guestCount: Number(data.guestCount),
        roomId: data.roomId || null,
        pricePerPerson: tier?.id !== "custom" ? tier?.pricePerPerson : null,
        menuSet,
        note: data.note,
      };

      const res = await fetch("/api/banquets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lá»—i gá»­i yÃªu cáº§u");

      setSuccess(json.message);
      reset();
      setSelectedTier(null);
      setCustomMenu(new Map());
      setStep(1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "CÃ³ lá»—i xáº£y ra");
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-jade-light rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-jade" />
          </div>
          <h2 className="font-display text-3xl text-jade mb-3">ÄÃ£ nháº­n yÃªu cáº§u!</h2>
          <p className="text-muted-foreground mb-8">{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="px-6 py-3 bg-jade text-white font-semibold rounded-2xl hover:bg-jade-mid transition-colors"
          >
            Äáº·t tiá»‡c khÃ¡c
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€ Step indicators
  const STEPS = [
    { n: 1 as const, label: "ThÃ´ng tin" },
    { n: 2 as const, label: "Chá»n menu" },
    { n: 3 as const, label: "XÃ¡c nháº­n" },
  ];

  return (
    <>
      {/* Hero */}
      <div className="bg-jade text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_20%_50%,white_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <PartyPopper size={24} className="text-gold" />
            <span className="text-gold font-semibold text-sm uppercase tracking-widest">
              Tiá»‡c & Sá»± kiá»‡n
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
            Tá»• chá»©c sá»± kiá»‡n<br />
            <em className="text-gold">Ä‘Ã¡ng nhá»›</em>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            NhÃ  hÃ ng PhÆ°Æ¡ng Anh â€” khÃ´ng gian sang trá»ng, áº©m thá»±c chuáº©n vá»‹,
            dá»‹ch vá»¥ táº­n tÃ¢m cho ngÃ y trá»ng Ä‘áº¡i cá»§a báº¡n.
          </p>
        </div>
      </div>

      {/* Rooms showcase */}
      {rooms.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl text-ink text-center mb-2">
            PhÃ²ng & Sáº£nh tiá»‡c
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            {rooms.length} khÃ´ng gian â€” sá»©c chá»©a {Math.min(...rooms.map((r) => r.capacity))}
            {" â€“ "}
            {Math.max(...rooms.map((r) => r.capacity))} khÃ¡ch
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[rgb(var(--border))]">
                <div className="relative h-40 bg-jade-light">
                  {room.images[0] || getRoomImage(room.name) ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={room.images[0] || getRoomImage(room.name)} alt={room.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-5xl opacity-20">ðŸ›ï¸</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ink">{room.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {room.capacity} khÃ¡ch
                    </span>
                    {room.pricePerDay && (
                      <span className="text-terra font-semibold">
                        {formatPrice(room.pricePerDay)}/ngÃ y
                      </span>
                    )}
                  </div>
                  {room.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.equipment.slice(0, 5).map((eq) => (
                        <span key={eq} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">
                          {EQUIPMENT_ICONS[eq] ?? "âœ“"} {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Booking form */}
      <section className="bg-jade-light py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-jade text-center mb-2">
            Äáº·t tiá»‡c ngay
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Äiá»n thÃ´ng tin â€” chÃºng tÃ´i sáº½ liÃªn há»‡ bÃ¡o giÃ¡ trong 2 giá»
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {STEPS.map(({ n, label }, idx) => (
              <div key={n} className="flex items-center gap-3">
                <button
                  onClick={() => n < step && setStep(n)}
                  className={`flex items-center gap-2 text-sm transition-all ${
                    step === n
                      ? "font-semibold text-jade"
                      : n < step
                      ? "text-muted-foreground cursor-pointer hover:text-jade"
                      : "text-muted-foreground/50 cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step > n
                        ? "bg-jade text-white"
                        : step === n
                        ? "bg-jade text-white ring-4 ring-jade/20"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step > n ? "âœ“" : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-px ${step > n ? "bg-jade" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-sm border border-[rgb(var(--border))] overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)}>

              {/* â”€â”€ Step 1: Basic Info â”€â”€ */}
              {step === 1 && (
                <div className="p-6 space-y-4">
                  <h3 className="font-display text-xl text-ink mb-4">ThÃ´ng tin sá»± kiá»‡n</h3>

                  {/* Event type */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Loáº¡i sá»± kiá»‡n <span className="text-red-400">*</span>
                    </label>
                    <select
                      {...register("eventType")}
                      className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 bg-white"
                    >
                      <option value="">â€” Chá»n loáº¡i sá»± kiá»‡n â€”</option>
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.eventType && (
                      <p className="text-xs text-red-500 mt-1">{errors.eventType.message}</p>
                    )}
                  </div>

                  {/* Date + Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        NgÃ y <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        {...register("eventDate")}
                        className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                      />
                      {errors.eventDate && (
                        <p className="text-xs text-red-500 mt-1">{errors.eventDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        Giá» <span className="text-red-400">*</span>
                      </label>
                      <select
                        {...register("eventTime")}
                        className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 bg-white"
                      >
                        <option value="">â€” Chá»n giá» â€”</option>
                        {["10:00","11:00","11:30","17:00","17:30","18:00","18:30","19:00"].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {errors.eventTime && (
                        <p className="text-xs text-red-500 mt-1">{errors.eventTime.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Guest count */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                      Sá»‘ khÃ¡ch dá»± kiáº¿n <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        {...register("guestCount")}
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                        placeholder="50"
                        min={10}
                        max={1000}
                      />
                    </div>
                    {errors.guestCount && (
                      <p className="text-xs text-red-500 mt-1">{errors.guestCount.message}</p>
                    )}
                  </div>

                  {/* Room selection */}
                  {rooms.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Chá»n phÃ²ng / sáº£nh
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {rooms.map((room) => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            selected={selectedRoomId === room.id}
                            onSelect={() => setValue("roomId", room.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="font-semibold text-sm text-ink mb-3">ThÃ´ng tin liÃªn há»‡</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Há» tÃªn <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              {...register("customerName")}
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                              placeholder="Nguyá»…n VÄƒn A"
                            />
                          </div>
                          {errors.customerName && (
                            <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            Äiá»‡n thoáº¡i <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              {...register("customerPhone")}
                              type="tel"
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                              placeholder="098.648.2222"
                            />
                          </div>
                          {errors.customerPhone && (
                            <p className="text-xs text-red-500 mt-1">{errors.customerPhone.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                          Email (nháº­n bÃ¡o giÃ¡ PDF)
                        </label>
                        <input
                          {...register("customerEmail")}
                          type="email"
                          className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                          Ghi chÃº yÃªu cáº§u Ä‘áº·c biá»‡t
                        </label>
                        <textarea
                          {...register("note")}
                          rows={2}
                          className="w-full px-3 py-2.5 text-sm border border-[rgb(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/30 resize-none"
                          placeholder="Trang trÃ­ Ä‘áº·c biá»‡t, menu chay, dá»‹ á»©ng thá»±c pháº©m..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* â”€â”€ Step 2: Menu Selection â”€â”€ */}
              {step === 2 && (
                <div className="p-6">
                  <h3 className="font-display text-xl text-ink mb-2">Chá»n thá»±c Ä‘Æ¡n</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Chá»n set menu cÃ³ sáºµn hoáº·c tá»± chá»n tá»«ng mÃ³n theo Ã½ muá»‘n
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {SET_MENU_TIERS.map((tier) => (
                      <SetMenuCard
                        key={tier.id}
                        tier={tier}
                        selected={selectedTier === tier.id}
                        guestCount={guestCount}
                        onSelect={() => setSelectedTier(tier.id)}
                      />
                    ))}
                  </div>

                  {selectedTier === "custom" && (
                    <CustomMenuPicker
                      menuItems={menuItems}
                      selected={customMenu}
                      onChange={handleCustomMenuChange}
                    />
                  )}
                </div>
              )}

              {/* â”€â”€ Step 3: Review + Submit â”€â”€ */}
              {step === 3 && (
                <div className="p-6">
                  <h3 className="font-display text-xl text-ink mb-5">Xem láº¡i & XÃ¡c nháº­n</h3>

                  <div className="space-y-4">
                    {/* Summary card */}
                    <div className="bg-jade-light rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <PartyPopper size={18} className="text-jade" />
                        <span className="font-semibold text-jade">TÃ³m táº¯t Ä‘áº·t tiá»‡c</span>
                      </div>

                      {[
                        ["Sá»± kiá»‡n", watch("eventType")],
                        ["NgÃ y giá»", watch("eventDate") && watch("eventTime")
                          ? `${watch("eventDate")} lÃºc ${watch("eventTime")}`
                          : "â€”"],
                        ["Sá»‘ khÃ¡ch", `${guestCount} ngÆ°á»i`],
                        ["PhÃ²ng", rooms.find((r) => r.id === selectedRoomId)?.name ?? "ChÆ°a chá»n"],
                        ["Thá»±c Ä‘Æ¡n", tier ? `${tier.label} â€” ${tier.description}` : "ChÆ°a chá»n"],
                        ["LiÃªn há»‡", `${watch("customerName")} Â· ${watch("customerPhone")}`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{label}:</span>
                          <span className="font-medium text-ink text-right max-w-[200px]">{value}</span>
                        </div>
                      ))}

                      {estimatedTotal > 0 && (
                        <div className="border-t border-jade/20 pt-3 flex justify-between items-baseline">
                          <span className="text-sm font-semibold text-jade">Æ¯á»›c tÃ­nh</span>
                          <span className="font-display text-2xl font-bold text-jade price-tag">
                            {formatPrice(estimatedTotal)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                      <Info size={14} className="flex-shrink-0 mt-0.5" />
                      <p>
                        ÄÃ¢y lÃ  bÃ¡o giÃ¡ Æ°á»›c tÃ­nh. NhÃ¢n viÃªn sáº½ liÃªn há»‡ xÃ¡c nháº­n chÃ­nh thá»©c
                        vÃ  Ä‘iá»u chá»‰nh menu theo yÃªu cáº§u trong vÃ²ng 2 giá».
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                    className="flex-1 py-3 text-sm font-medium border border-[rgb(var(--border))] rounded-2xl bg-white hover:bg-gray-50 transition-colors"
                  >
                    â† Quay láº¡i
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                    className="flex-1 py-3 text-sm font-semibold bg-jade text-white rounded-2xl hover:bg-jade-mid transition-colors shadow-sm"
                  >
                    Tiáº¿p theo â†’
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-jade text-white rounded-2xl hover:bg-jade-mid disabled:opacity-60 transition-colors shadow-md shadow-jade/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Äang gá»­i...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Gá»­i yÃªu cáº§u Ä‘áº·t tiá»‡c
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="mt-20 py-8 border-t border-[rgb(var(--border))] text-center text-sm text-muted-foreground bg-white">
        <p>ðŸ“ž 098.648.2222 Â· ðŸ“ TÃ¢n Láº­p 04, PhÆ°á»ng TÃ­ch LÆ°Æ¡ng, ThÃ¡i NguyÃªn Â· ðŸ•™ 10:00 â€“ 22:00</p>
        <p className="mt-2">Â© {new Date().getFullYear()} PhÆ°Æ¡ng Anh Banquet. All rights reserved.</p>
      </footer>
    </>
  );
}

