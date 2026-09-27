import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-md border border-ink/10 bg-white/80 px-4 text-sm outline-none transition focus:border-champagne focus:ring-4 focus:ring-champagne/15",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-md border border-ink/10 bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-champagne focus:ring-4 focus:ring-champagne/15",
        props.className
      )}
    />
  );
}
