import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "dark";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-champagne text-ink hover:bg-[#b89962]",
        variant === "dark" && "bg-ink text-white hover:bg-emerald",
        variant === "outline" && "border border-ink/15 bg-transparent hover:border-champagne hover:bg-white/60",
        variant === "ghost" && "hover:bg-white/60",
        className
      )}
      {...props}
    />
  );
}
