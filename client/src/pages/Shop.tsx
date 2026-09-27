import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import type { Category, Product } from "@shared/schema";

export function Shop() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const [category, setCategory] = useState(params.get("category") || "");
  const [style, setStyle] = useState("");
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("newest");
  const query = useMemo(() => new URLSearchParams({ ...(category && { category }), ...(style && { style }), ...(size && { size }), sort }).toString(), [category, style, size, sort]);
  const { data: products = [] } = useQuery<Array<Product & { _id: string }>>({ queryKey: ["products", query], queryFn: () => api(`/api/products?${query}`) });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api("/api/categories") });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">The collection</p>
          <h1 className="mt-2 font-display text-5xl">Decorative Glass</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-ink/60"><SlidersHorizontal className="h-4 w-4" /> {products.length} pieces</div>
      </div>
      <div className="mt-8 grid gap-4 rounded-lg border border-ink/10 bg-white/65 p-4 md:grid-cols-4">
        <Select value={category} onChange={setCategory} label="Category" options={[["", "All categories"], ...categories.map((c) => [c.slug, c.name] as [string, string])]} />
        <Select value={style} onChange={setStyle} label="Style" options={[["", "All styles"], ["Modern", "Modern"], ["Art Deco", "Art Deco"], ["Classic", "Classic"], ["Minimal", "Minimal"], ["Botanical", "Botanical"]]} />
        <Select value={size} onChange={setSize} label="Size" options={[["", "All sizes"], ["Small", "Small"], ["Medium", "Medium"], ["Large", "Large"]]} />
        <Select value={sort} onChange={setSort} label="Sort" options={[["newest", "Newest"], ["price_asc", "Price low to high"], ["price_desc", "Price high to low"], ["name", "Name"]]} />
      </div>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
    </section>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11 w-full rounded-md border border-ink/10 bg-white px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-champagne">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
