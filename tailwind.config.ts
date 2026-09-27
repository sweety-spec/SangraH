import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["Poppins", "sans-serif"]
      },
      colors: {
        ink: "#1b1b1b",
        porcelain: "#f8f5ef",
        champagne: "#c9aa73",
        smoke: "#6d746f",
        emerald: "#26483f",
        blush: "#d9b9a8"
      },
      boxShadow: {
        luxe: "0 24px 70px rgba(27, 27, 27, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
