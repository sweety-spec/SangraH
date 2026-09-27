import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function resolveImageUrl(src?: string): string {
  if (!src) return "/images/modi-glass-collection.png";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  if (src.startsWith("/api/")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    return `${baseUrl}${src}`;
  }
  return src;
}
