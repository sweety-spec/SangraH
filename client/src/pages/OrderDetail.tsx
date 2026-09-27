import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Download, Headphones, MapPin, PackageCheck, RotateCcw, ShoppingBag, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Order } from "@shared/schema";

const statusSteps = ["pending", "paid", "processing", "shipped", "delivered"] as const;

export function OrderDetail({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: order, isLoading, error } = useQuery<Order>({ queryKey: ["order", id], queryFn: () => api(`/api/orders/${id}`) });

  const cancel = useMutation({
    mutationFn: () => api<{ order: Order }>(`/api/orders/${id}/cancel`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["order", id] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const reorder = useMutation({
    mutationFn: async () => {
      if (!order) return;
      for (const item of order.items) {
        await api("/api/cart", { method: "POST", ...jsonBody({ productId: item.productId, quantity: item.quantity }) });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/cart");
    }
  });

  if (isLoading) return <section className="mx-auto max-w-6xl px-4 py-20">Loading order...</section>;
  if (error || !order) return <section className="mx-auto max-w-6xl px-4 py-20">Order not found.</section>;

  const canCancel = !["shipped", "delivered", "cancelled"].includes(order.status);
  const cancelUnavailableReason = order.status === "shipped"
    ? "Cancellation is closed because this order has shipped."
    : order.status === "delivered"
      ? "Delivered orders cannot be cancelled online."
      : order.status === "cancelled"
        ? "This order is already cancelled."
        : "";
  const canPay = order.paymentStatus !== "paid" && order.paymentMethod !== "cod";
  const supportText = encodeURIComponent(`Hi SangraH, I would like to enquire about my order... ${order.orderNumber}.`);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="print:hidden">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65 hover:text-champagne">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-champagne">Order details</p>
          <h1 className="mt-2 font-display text-5xl">{order.orderNumber}</h1>
          <p className="mt-3 text-sm text-ink/55">Placed {formatDate(order.createdAt)} / {order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          {canPay && <Link href={`/payment/${order._id}`}><Button><CreditCard className="h-4 w-4" /> Pay now</Button></Link>}
          <Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" /> Invoice</Button>
          <Button variant="outline" onClick={() => reorder.mutate()} disabled={reorder.isPending}><RotateCcw className="h-4 w-4" /> Reorder</Button>
          {canCancel && <Button variant="outline" onClick={() => cancel.mutate()} disabled={cancel.isPending}><XCircle className="h-4 w-4" /> Cancel</Button>}
          {!canCancel && cancelUnavailableReason && (
            <Button variant="outline" disabled title={cancelUnavailableReason}><XCircle className="h-4 w-4" /> Cannot cancel</Button>
          )}
        </div>
      </div>

      {!canCancel && cancelUnavailableReason && <p className="mt-4 rounded-md bg-white p-3 text-sm text-ink/60 print:hidden">{cancelUnavailableReason}</p>}
      {cancel.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 print:hidden">{cancel.error.message}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-6">
          <Card className="p-6">
            <div className="flex flex-wrap gap-2">
              <Badge status={order.status}>{order.status.replace(/_/g, " ")}</Badge>
              <Badge status={order.paymentStatus}>{order.paymentStatus.replace(/_/g, " ")}</Badge>
              <Badge>{order.paymentMethod.replace(/_/g, " ")}</Badge>
            </div>
            <h2 className="mt-6 font-display text-3xl">Order progress</h2>
            {order.status === "cancelled" ? (
              <div className="mt-5 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">This order has been cancelled.</p>
                  {order.paymentStatus === "refund_initiated" && (
                    <p className="mt-1 text-xs leading-5 text-red-600">
                      Refund has been initiated. It will be credited back to your original payment method.
                    </p>
                  )}
                  {order.paymentStatus === "refunded" && (
                    <p className="mt-1 text-xs leading-5 text-emerald font-semibold">
                      Refund has been processed and completed.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-5">
                {statusSteps.map((step, index) => <ProgressStep key={step} label={step} active={statusIndex(order.status) >= index} />)}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-3xl">Items</h2>
            <div className="mt-5 grid gap-4">
              {order.items.map((item) => (
                <div key={item.productId} className="grid gap-4 border-b border-ink/10 pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[92px_1fr_auto]">
                  <Link href={`/product/${item.slug}`}><img src={resolveImageUrl(item.image)} alt={item.name} className="h-24 w-24 rounded-md object-cover" /></Link>
                  <div>
                    <Link href={`/product/${item.slug}`} className="font-display text-2xl">{item.name}</Link>
                    <p className="mt-1 text-sm text-ink/55">Quantity: {item.quantity}</p>
                    <p className="mt-1 text-sm text-ink/55">Unit price: {money(item.price)}</p>
                  </div>
                  <p className="font-semibold">{money(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-champagne" />
                <h2 className="font-display text-2xl">Delivery address</h2>
              </div>
              <address className="mt-4 not-italic leading-8 text-ink/65">
                <strong className="text-ink">{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.phone}<br />
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                {order.shippingAddress.country}
              </address>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-champagne" />
                <h2 className="font-display text-2xl">Delivery updates</h2>
              </div>
              <p className="mt-4 leading-7 text-ink/65">{deliveryMessage(order)}</p>
              <p className="mt-3 text-sm text-ink/50">Tracking details will appear here once the order is shipped.</p>
            </Card>
          </div>
        </div>

        <aside className="grid h-fit gap-6">
          <Card className="p-6">
            <h2 className="font-display text-3xl">Payment summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <Line label="Subtotal" value={money(order.subtotal)} />
              <Line label="Shipping" value={order.shipping === 0 ? "Free" : money(order.shipping)} />
              <Line label="GST" value={money(order.tax)} />
              <div className="border-t border-ink/10 pt-3">
                <Line label="Total" value={money(order.total)} strong />
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-porcelain p-4 text-sm text-ink/65">
              <p>Payment: {order.paymentMethod.replace("_", " ")}</p>
              <p>Status: {order.paymentStatus.replace(/_/g, " ")}</p>
              {order.razorpayPaymentId && <p className="break-all">Razorpay payment: {order.razorpayPaymentId}</p>}
            </div>
          </Card>

          <Card className="p-6 print:hidden">
            <div className="flex items-center gap-3">
              <Headphones className="h-5 w-5 text-champagne" />
              <h2 className="font-display text-2xl">Need help?</h2>
            </div>
            <p className="mt-3 text-sm leading-7 text-ink/60">Contact support for delivery changes, damage claims, or styling help related to this order.</p>
            <a href={`https://wa.me/919999999999?text=${supportText}`} target="_blank" rel="noreferrer">
              <Button className="mt-5 w-full" variant="dark">WhatsApp support</Button>
            </a>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-champagne" />
              <h2 className="font-display text-2xl">Buyer protection</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink/60">
              <li>Secure payment verification for online orders.</li>
              <li>Carefully packed glass products with fragile handling.</li>
              <li>Support for replacement requests if damage is reported on delivery.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function ProgressStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3 md:block">
      <div className={`grid h-9 w-9 place-items-center rounded-full border ${active ? "border-champagne bg-champagne text-ink" : "border-ink/15 bg-white text-ink/40"}`}>
        <ShoppingBag className="h-4 w-4" />
      </div>
      <p className={`mt-0 text-sm font-semibold capitalize md:mt-3 ${active ? "text-ink" : "text-ink/40"}`}>{label}</p>
    </div>
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

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "text-lg font-semibold" : "text-ink/65"}`}><span>{label}</span><span>{value}</span></div>;
}

function statusIndex(status: Order["status"]) {
  const index = statusSteps.indexOf(status as (typeof statusSteps)[number]);
  return index === -1 ? 0 : index;
}

function formatDate(value?: string) {
  if (!value) return "recently";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function deliveryMessage(order: Order) {
  if (order.status === "pending") return "We are waiting for payment confirmation before preparing your order.";
  if (order.status === "paid") return "Payment is received. Your decorative glass pieces will move to preparation shortly.";
  if (order.status === "processing") return "Your order is being packed with protective materials for safe delivery.";
  if (order.status === "shipped") return "Your order has shipped. Tracking information will be shared by support.";
  if (order.status === "delivered") return "Your order has been delivered. We hope it looks beautiful in your space.";
  return "This order has been cancelled. Contact support if you need help placing it again.";
}
