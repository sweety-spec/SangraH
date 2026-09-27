import { Check, Heart, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Product } from "@shared/schema";

type WishRow = { _id: string; productId: Product & { _id: string } };

export function ProductCard({ product }: { product: Product & { _id: string } }) {
  if (!product) return null;
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);
  const { data: wishRows = [] } = useQuery<WishRow[]>({ queryKey: ["wishlist"], queryFn: () => api("/api/wishlist") });
  const isWishlisted = wishRows.some((row) => row.productId?._id === product._id);

  const addCart = useMutation({
    mutationFn: () => api("/api/cart", { method: "POST", ...jsonBody({ productId: product._id, quantity: 1 }) }),
    onSuccess: async () => {
      setAdded(true);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.setTimeout(() => setAdded(false), 1800);
    }
  });

  const toggleWish = useMutation({
    mutationFn: () =>
      isWishlisted
        ? api(`/api/wishlist?productId=${product._id}`, { method: "DELETE" })
        : api("/api/wishlist", { method: "POST", ...jsonBody({ productId: product._id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] })
  });

  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="product-frame block overflow-hidden rounded-lg bg-white">
        <img src={resolveImageUrl(product.image)} alt={product.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <Link href={`/product/${product.slug}`} className="font-display text-xl font-semibold">{product.name}</Link>
          <p className="mt-1 text-sm text-ink/60">{product.style} / {product.size}</p>
          <p className="mt-2 font-semibold">{money(product.price)}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`h-10 w-10 px-0 transition-colors ${isWishlisted ? "border-champagne bg-champagne/10 text-ink" : ""}`}
            onClick={() => toggleWish.mutate()}
            disabled={toggleWish.isPending}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-champagne text-champagne" : ""}`} />
          </Button>
          <Button className={`h-10 px-3 ${added ? "w-auto" : "w-10"} transition-all`} onClick={() => addCart.mutate()} disabled={addCart.isPending} aria-label={added ? "Added to cart" : "Add to cart"}>
            {added ? <><Check className="h-4 w-4" /> Added</> : <ShoppingBag className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </article>
  );
}
