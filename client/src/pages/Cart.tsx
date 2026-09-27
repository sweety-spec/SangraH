import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Product } from "@shared/schema";

type CartRow = { _id: string; quantity: number; productId: Product & { _id: string } };

export function Cart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: rows = [] } = useQuery<CartRow[]>({ queryKey: ["cart"], queryFn: () => api("/api/cart") });
  const update = useMutation({ mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => api("/api/cart", { method: "PATCH", ...jsonBody({ productId, quantity }) }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }) });
  const remove = useMutation({ mutationFn: (productId: string) => api(`/api/cart?productId=${productId}`, { method: "DELETE" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }) });
  const validRows = rows.filter((row) => Boolean(row?.productId));
  const total = validRows.reduce((sum, row) => sum + row.productId.price * row.quantity, 0);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Cart</h1>
      <div className="mt-8 grid gap-4">
        {validRows.map((row) => (
          <div key={row._id} className="grid gap-4 rounded-lg border border-ink/10 bg-white p-4 sm:grid-cols-[110px_1fr_auto]">
            <img src={resolveImageUrl(row.productId.image)} alt={row.productId.name} className="h-28 w-28 rounded-md object-cover" />
            <div>
              <h2 className="font-display text-2xl">{row.productId.name}</h2>
              <p className="mt-1 text-sm text-ink/60">{money(row.productId.price)}</p>
              <div className="mt-4 inline-flex items-center rounded-md border border-ink/10">
                <button className="px-3 py-2" onClick={() => update.mutate({ productId: row.productId._id, quantity: Math.max(1, row.quantity - 1) })}>-</button>
                <span className="px-4">{row.quantity}</span>
                <button className="px-3 py-2" onClick={() => update.mutate({ productId: row.productId._id, quantity: row.quantity + 1 })}>+</button>
              </div>
            </div>
            <button onClick={() => remove.mutate(row.productId._id)} aria-label="Remove item"><Trash2 className="h-5 w-5" /></button>
          </div>
        ))}
        {!rows.length && <p className="rounded-lg border border-ink/10 bg-white p-8 text-ink/60">Your cart is empty.</p>}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-lg bg-ink p-6 text-white">
        <span>Total</span>
        <strong className="text-2xl">{money(total)}</strong>
      </div>
      <div className="mt-6 flex justify-end">
        <Link href={user ? "/checkout" : "/auth"}>
          <Button variant="dark" disabled={!rows.length}>{user ? "Proceed to checkout" : "Login to checkout"}</Button>
        </Link>
      </div>
    </section>
  );
}
