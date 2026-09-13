import type { Config } from "tailwindcss";

const config: Config = {
  // 1. Add 'darkMode' if you plan to use it later
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}", // Added safety path
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-outfit)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      // 2. Add these keyframes for shadcn animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // 3. IMPORTANT: Add the animate plugin here
  plugins: [require("tailwindcss-animate")],
};

export default config;
