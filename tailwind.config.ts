// tailwind.config.ts
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:        "rgb(10 15 30)",
        gold:        "rgb(201 168 76)",
        ivory:       "rgb(250 247 242)",
        charcoal:    "rgb(26 26 26)",
        "muted-gold":"rgb(212 186 114)",
        border:      "rgb(225 215 200)",
        background:  "rgb(250 247 242)",
        foreground:  "rgb(26 26 26)",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "Georgia", "serif"],
        body:    ["Lora", "Georgia", "serif"],
        ui:      ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:  "0 4px 12px rgba(10, 15, 30, 0.03)",
        "card-hover": "0 20px 40px -8px rgba(10, 15, 30, 0.08)",
        navy:  "0 8px 24px -4px rgba(10, 15, 30, 0.25)",
        gold:  "0 8px 24px -4px rgba(201, 168, 76, 0.25)",
      },
      animation: {
        "fade-in":    "fadeIn 0.5s ease both",
        "slide-up":   "slideUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "slide-right":"slideRight 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
      },
      keyframes: {
        fadeIn:     { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:    { from: { opacity: "0", transform: "translateY(24px)" },
                      to:   { opacity: "1", transform: "translateY(0)" } },
        slideRight: { from: { transform: "translateX(100%)" },
                      to:   { transform: "translateX(0)" } },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
