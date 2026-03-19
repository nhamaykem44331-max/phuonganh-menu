// src/components/menu/CategoryTabs.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface CategoryTabsProps {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
      setTimeout(checkScroll, 350); // Mượt mà chờ cuộn xong
    }
  }, [active]);

  const allCategories = [
    { id: "all", name: "Tất cả", slug: "all", icon: "🍽️" },
    ...categories,
  ];

  return (
    <div className="relative border-b border-border/60 mb-8 flex items-center">
      {/* Nút Left */}
      {showLeft && (
        <button
          onClick={() => {
            scrollRef.current?.scrollBy({ left: -250, behavior: "smooth" });
            setTimeout(checkScroll, 350);
          }}
          className="absolute left-0 -ml-3 z-10 w-8 h-8 hidden md:flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-slate-200 rounded-full text-slate-600 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Mask Mờ Trái (Chỉ hiện khi có thể cuộn left) */}
      {showLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-ivory to-transparent z-[1] pointer-events-none hidden md:block"></div>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex overflow-x-auto scrollbar-thin px-2 py-1 w-full relative z-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .scrollbar-thin::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {allCategories.map((cat) => {
          const isActive = active === cat.slug;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onChange(cat.slug)}
              className={`cat-tab shrink-0 ${isActive ? "active" : ""}`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Mask Mờ Phải (Chỉ hiện khi có thể cuộn right) */}
      {showRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-ivory to-transparent z-[1] pointer-events-none hidden md:block"></div>
      )}

      {/* Nút Right */}
      {showRight && (
        <button
          onClick={() => {
            scrollRef.current?.scrollBy({ left: 250, behavior: "smooth" });
            setTimeout(checkScroll, 350);
          }}
          className="absolute right-0 -mr-3 z-10 w-8 h-8 hidden md:flex items-center justify-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-slate-200 rounded-full text-slate-600 hover:text-[var(--gold)] hover:border-[var(--gold)] transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
