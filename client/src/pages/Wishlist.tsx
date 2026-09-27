import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import type { Product } from "@shared/schema";

type WishRow = { _id: string; productId: Product & { _id: string } };

export function Wishlist() {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery<WishRow[]>({ queryKey: ["wishlist"], queryFn: () => api("/api/wishlist") });
  const remove = useMutation({ mutationFn: (productId: string) => api(`/api/wishlist?productId=${productId}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }) });

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Wishlist</h1>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {rows
          .filter((row) => Boolean(row?.productId))
          .map((row) => (
            <div key={row._id} className="relative">
              <ProductCard product={row.productId} />
              <button className="absolute right-3 top-3 rounded-full bg-white p-2 shadow" onClick={() => remove.mutate(row.productId._id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
      </div>
      {!rows.length && <p className="mt-8 rounded-lg border border-ink/10 bg-white p-8 text-ink/60">Your saved pieces will appear here.</p>}
    </section>
  );
}
