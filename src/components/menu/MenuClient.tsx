// src/components/menu/MenuClient.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { CategoryTabs } from "./CategoryTabs";
import { SearchBar } from "./SearchBar";
import { MenuGrid } from "./MenuGrid";
import { HeroBanner } from "./HeroBanner";
import { OrderForm } from "./OrderForm";

interface Category {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  icon: string | null;
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
  categoryId: string;
  category: { id: string; slug: string; name: string };
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
}

interface MenuClientProps {
  categories: Category[];
  menuItems: MenuItem[];
  banners: Banner[];
}

export function MenuClient({ categories, menuItems, banners }: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search + category filter — pure client-side
  const filteredItems = useMemo(() => {
    let items = menuItems;

    // Filter by category
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category.slug === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.nameEn?.toLowerCase().includes(q) ?? false) ||
          (item.description?.toLowerCase().includes(q) ?? false)
      );
    }

    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const handleCategoryChange = useCallback((slug: string) => {
    setActiveCategory(slug);
    setSearchQuery(""); // Reset search khi đổi danh mục
  }, []);

  return (
    <>
      {/* Hero Banner */}
      <HeroBanner banners={banners} />

      {/* Intro text */}
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-4 text-center">
        <p className="font-display italic text-gold text-2xl md:text-3xl mb-4">
          Ẩm thực tinh tế — Phong vị Việt Nam
        </p>
        <div className="w-12 h-px bg-gold/50 mx-auto mb-6" />
        <p className="font-body text-charcoal/60 font-light leading-relaxed max-w-2xl mx-auto">
          Tại Phương Anh, mỗi món ăn là một tác phẩm nghệ thuật được chuẩn bị bằng cả trái tim,
          giao thoa giữa hương vị truyền thống tinh tuý và phong cách ẩm thực hiện đại sang trọng.
        </p>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-20 z-30 bg-ivory/95 backdrop-blur-md pb-4 pt-2">
        <div className="max-w-6xl mx-auto px-4">
          {/* Category tabs */}
          <CategoryTabs
            categories={categories}
            active={activeCategory}
            onChange={handleCategoryChange}
          />

          {/* Search bar */}
          <div className="max-w-md mx-auto sm:mx-0">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Khám phá thực đơn..."
            />
          </div>
        </div>
      </div>

      {/* Menu grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* Result count */}
        {searchQuery && (
          <p className="text-sm text-charcoal/50 mb-8 font-light italic">
            Tìm thấy{" "}
            <span className="font-medium text-navy">{filteredItems.length}</span>{" "}
            tuyệt tác cho <em>"{searchQuery}"</em>
          </p>
        )}

        <MenuGrid items={filteredItems} />
      </main>

      {/* Booking form section */}
      <section id="dat-ban" className="bg-ivory py-24 border-t border-gold/20">
        <div className="max-w-3xl mx-auto px-4">
          <OrderForm cartItems={[]} />
        </div>
      </section>

      {/* Luxury Footer */}
      <footer className="bg-navy text-ivory/80 py-16 border-t border-gold/30">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-3 gap-12 md:gap-8">
          <div className="pr-4 border-b sm:border-b-0 sm:border-r border-gold/10 pb-8 sm:pb-0">
            <h3 className="font-display uppercase tracking-[0.2em] text-gold text-xl mb-4">Phương Anh</h3>
            <p className="text-sm font-light leading-relaxed text-ivory/60">
              Trải nghiệm ẩm thực đẳng cấp trong không gian sang trọng, dịch vụ chuyên nghiệp. Sự hoàn hảo trong từng chi tiết.
            </p>
          </div>
          <div className="border-b sm:border-b-0 sm:border-r border-gold/10 pb-8 sm:pb-0 sm:pl-8">
            <h4 className="font-display italic text-gold text-lg mb-4">Thông tin liên hệ</h4>
            <ul className="text-sm font-light space-y-3 text-ivory/70">
              <li className="flex items-start gap-3">
                <span className="text-gold mt-1">✆</span>
                098.648.2222
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-1">⚲</span>
                Tân Lập 04, Phường Tích Lương, Thái Nguyên
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold mt-1">◷</span>
                10:00 – 22:30 hàng ngày
              </li>
            </ul>
          </div>
          <div className="sm:pl-8">
            <h4 className="font-display italic text-gold text-lg mb-4">Dịch vụ đẳng cấp</h4>
            <ul className="text-sm font-light space-y-3 text-ivory/70">
              <li>— Không gian tiệc thượng lưu</li>
              <li>— Khách sạn nghỉ dưỡng 5 sao</li>
              <li>— Phòng VIP riêng tư</li>
              <li>— Dịch vụ sự kiện trọn gói</li>
            </ul>
            
            <div className="flex gap-2 mt-5">
              {[
                { src: '/spaces/sanh-tiec.jpg', alt: 'Sảnh tiệc' },
                { src: '/spaces/san-vuon.jpg', alt: 'Sân vườn' },
                { src: '/spaces/phong-vip.jpg', alt: 'Phòng VIP' },
              ].map((img) => (
                <div 
                  key={img.src}
                  className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                  style={{ border: '1px solid rgba(201,168,76,0.3)' }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-gold/10 text-[10px] uppercase tracking-widest text-center text-ivory/40">
          © {new Date().getFullYear()} PHƯƠNG ANH HOSPITALITY. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </>
  );
}
