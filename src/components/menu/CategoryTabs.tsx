// src/components/menu/CategoryTabs.tsx
"use client";

import { useRef, useEffect } from "react";

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

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [active]);

  const allCategories = [
    { id: "all", name: "Tất cả", slug: "all", icon: "🍽️" },
    ...categories,
  ];

  return (
    <div className="border-b border-border/60 mb-8">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-thin px-2 py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {allCategories.map((cat) => {
          const isActive = active === cat.slug;
          return (
            <button
              key={cat.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onChange(cat.slug)}
              className={`cat-tab ${isActive ? "active" : ""}`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
