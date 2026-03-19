// src/components/menu/HeroBanner.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
}

const DEFAULT_BANNERS: Banner[] = [
  { 
    id: "1", 
    title: "Không gian sang trọng", 
    imageUrl: "/banners/hero-1.jpg", 
    link: null 
  },
  { 
    id: "2", 
    title: "Ẩm thực tinh tế", 
    imageUrl: "/banners/hero-2.jpg", 
    link: null 
  },
  { 
    id: "3", 
    title: "Nhà hàng Phương Anh", 
    imageUrl: "/banners/hero-3.jpg", 
    link: null 
  },
];

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const displayBanners = banners.length > 0 ? banners : DEFAULT_BANNERS;
  
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % displayBanners.length);
  }, [displayBanners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + displayBanners.length) % displayBanners.length);
  }, [displayBanners.length]);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, displayBanners.length]);

  if (displayBanners.length === 0) return null;

  const banner = displayBanners[current];

  const Wrapper = banner.link
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={banner.link!}>{children}</Link>
      )
    : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  return (
    <div className="relative h-[65vh] sm:h-[70vh] w-full overflow-hidden bg-navy">
      {displayBanners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Wrapper>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.imageUrl}
              alt={b.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Fine Dining Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-black/30" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <p className="text-gold font-display italic text-2xl md:text-3xl lg:text-4xl mb-3 opacity-90 tracking-wide drop-shadow-md">
                Fine Dining Experience
              </p>
              <h2 className="text-ivory font-body uppercase tracking-[0.2em] font-light text-xl md:text-2xl drop-shadow-lg">
                {b.title}
              </h2>
            </div>
          </Wrapper>
        </div>
      ))}

      {/* Navigation Controls */}
      {displayBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-ivory/30 text-ivory flex items-center justify-center hover:bg-ivory hover:text-navy transition-colors backdrop-blur-sm"
          >
            <ChevronLeft size={20} strokeWidth={1} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-ivory/30 text-ivory flex items-center justify-center hover:bg-ivory hover:text-navy transition-colors backdrop-blur-sm"
          >
            <ChevronRight size={20} strokeWidth={1} />
          </button>

          {/* Dash Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {displayBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-[2px] transition-all duration-300 ${
                  i === current ? "w-8 bg-gold" : "w-4 bg-ivory/40 hover:bg-ivory/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
