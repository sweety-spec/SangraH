import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Order } from "@shared/schema";

export function Orders() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["orders"], queryFn: () => api("/api/orders") });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm uppercase tracking-[0.24em] text-champagne">Account</p>
      <h1 className="mt-2 font-display text-5xl">My Orders</h1>
      <div className="mt-8 grid gap-6">
        {orders.map((order) => (
          <Card key={order._id} className="p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-5 md:flex-row md:items-center">
              <div>
                <p className="font-display text-2xl font-semibold">#{order.orderNumber}</p>
                <p className="mt-1 text-sm text-ink/60">Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recently"}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-ink/5 px-3 py-1 font-medium capitalize text-ink">{order.status}</span>
                  <span className="rounded-full bg-ink/5 px-3 py-1 font-medium capitalize text-ink">Payment: {order.paymentStatus}</span>
                  <span className="rounded-full bg-ink/5 px-3 py-1 font-medium uppercase text-ink">{order.paymentMethod.replace("_", " ")}</span>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-semibold">{money(order.total)}</p>
                <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                  {order.paymentStatus !== "paid" && order.paymentMethod === "demo_card" && <Link href={`/payment/${order._id}`}><Button>Pay now</Button></Link>}
                  <Link href={`/orders/${order._id}`}><Button variant="outline">Details <ArrowRight className="h-4 w-4" /></Button></Link>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-ink/10 pt-5">
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 text-sm">
                  <img src={resolveImageUrl(item.image)} alt={item.name} className="h-14 w-14 rounded-md object-cover" />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-ink/55">Qty {item.quantity}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {!orders.length && (
          <Card className="p-8 text-center">
            <h2 className="font-display text-3xl">No orders yet</h2>
            <p className="mt-2 text-ink/60">Your checkout history will appear here.</p>
            <Link href="/shop"><Button className="mt-5" variant="dark">Start shopping</Button></Link>
          </Card>
        )}
      </div>
    </section>
  );
}

function Badge({ children, status }: { children: React.ReactNode; status?: string }) {
  const isCancelled = status === "cancelled" || status === "failed";
  const isRefund = status === "refund_initiated" || status === "refunded";
  const bgClass = isCancelled
    ? "bg-red-100 text-red-700"
    : isRefund
    ? "bg-amber-100 text-amber-900"
    : "bg-champagne/15 text-emerald";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${bgClass}`}>{children}</span>;
}
