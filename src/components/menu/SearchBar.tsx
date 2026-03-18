// src/components/menu/SearchBar.tsx
"use client";

import { Search, X } from "lucide-react";
import { useRef, useCallback } from "react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChange(raw);
      }, 280); // debounce 280ms
    },
    [onChange]
  );

  const handleClear = () => {
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <Search
        size={18}
        strokeWidth={1.5}
        className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/40 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="search"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder ?? "Tìm kiếm thực đơn..."}
        className="w-full pl-8 pr-8 py-3 bg-transparent border-b border-charcoal/20 text-charcoal
          focus:outline-none focus:border-gold transition-colors font-body placeholder:text-charcoal/40"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
