import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, MessageCircle, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Product } from "@shared/schema";

type Review = { _id: string; name: string; rating: number; comment: string; createdAt: string };

type WishRow = { _id: string; productId: Product & { _id: string } };

export function ProductDetail({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [review, setReview] = useState({ name: "", rating: 5, comment: "" });
  const [added, setAdded] = useState(false);
  const { data: product, isLoading } = useQuery<Product & { _id: string }>({ queryKey: ["product", slug], queryFn: () => api(`/api/products/${slug}`) });
  const { data: reviews = [] } = useQuery<Review[]>({ queryKey: ["reviews", slug], queryFn: () => api(`/api/products/${slug}/reviews`) });
  const { data: wishRows = [] } = useQuery<WishRow[]>({ queryKey: ["wishlist"], queryFn: () => api("/api/wishlist") });
  const isWishlisted = Boolean(product && wishRows.some((row) => row.productId?._id === product._id));
  const addCart = useMutation({
    mutationFn: () => api("/api/cart", { method: "POST", ...jsonBody({ productId: product!._id, quantity: 1 }) }),
    onSuccess: async () => {
      setAdded(true);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.setTimeout(() => setAdded(false), 1800);
    }
  });
  const toggleWish = useMutation({
    mutationFn: () =>
      isWishlisted
        ? api(`/api/wishlist?productId=${product!._id}`, { method: "DELETE" })
        : api("/api/wishlist", { method: "POST", ...jsonBody({ productId: product!._id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] })
  });
  const postReview = useMutation({
    mutationFn: () => api(`/api/products/${slug}/reviews`, { method: "POST", ...jsonBody({ ...review, rating: Number(review.rating) }) }),
    onSuccess: () => {
      setReview({ name: "", rating: 5, comment: "" });
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    }
  });

  if (isLoading || !product) return <div className="mx-auto max-w-7xl px-4 py-20">Loading...</div>;
  const whatsApp = `https://wa.me/919999999999?text=${encodeURIComponent(`Hi SangraH, I would like to enquire about ${product.name}.`)}`;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white">
          <img src={resolveImageUrl(product.image)} alt={product.name} className="aspect-[4/5] w-full object-cover" />
        </div>
        <div className="lg:pt-8">
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">{product.category}</p>
          <h1 className="mt-3 font-display text-5xl">{product.name}</h1>
          <p className="mt-5 text-2xl font-semibold">{money(product.price)}</p>
          <p className="mt-6 leading-8 text-ink/68">{product.description}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {product.tags.map((tag) => <span key={tag} className="rounded-full border border-ink/10 px-3 py-1">{tag}</span>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => addCart.mutate()} disabled={addCart.isPending}>
              {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {added ? "Added to cart" : "Add to cart"}
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleWish.mutate()}
              disabled={toggleWish.isPending}
              className={isWishlisted ? "border-champagne bg-champagne/10 text-ink" : ""}
            >
              <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-champagne text-champagne" : ""}`} />
              {isWishlisted ? "Wishlisted" : "Wishlist"}
            </Button>
            <a href={whatsApp} target="_blank" rel="noreferrer"><Button variant="dark"><MessageCircle className="h-4 w-4" /> WhatsApp enquiry</Button></a>
          </div>
        </div>
      </div>
      <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="font-display text-3xl">Reviews</h2>
          <div className="mt-5 grid gap-4">
            {reviews.length === 0 && <p className="text-ink/60">No reviews yet.</p>}
            {reviews.map((r) => (
              <div key={r._id} className="rounded-lg border border-ink/10 bg-white p-5">
                <div className="flex items-center gap-2">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-champagne text-champagne" />)}</div>
                <p className="mt-3 text-sm text-ink/70">{r.comment}</p>
                <p className="mt-3 text-sm font-semibold">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
        <form className="rounded-lg border border-ink/10 bg-white p-5" onSubmit={(e) => { e.preventDefault(); postReview.mutate(); }}>
          <h3 className="font-display text-2xl">Leave a review</h3>
          <div className="mt-4 grid gap-3">
            <Input placeholder="Name" value={review.name} onChange={(e) => setReview({ ...review, name: e.target.value })} required />
            <Input type="number" min={1} max={5} value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })} required />
            <Textarea placeholder="Your review" value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} required />
            <Button type="submit">Submit review</Button>
          </div>
        </form>
      </div>
    </section>
  );
}
