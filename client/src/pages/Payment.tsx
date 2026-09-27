import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import type { Order } from "@shared/schema";

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export function Payment({ id }: { id: string }) {
  const { data: order } = useQuery<Order>({ queryKey: ["order", id], queryFn: () => api(`/api/orders/${id}`) });

  if (!order) return <div className="mx-auto max-w-4xl px-4 py-20">Loading payment...</div>;

  if (order.paymentStatus === "paid") {
    return <PaymentSuccess order={order} />;
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-champagne">Order {order.orderNumber}</p>
        <h1 className="mt-2 font-display text-5xl">Complete payment</h1>
        {order.paymentMethod === "razorpay" ? <RazorpayPayment order={order} /> : order.paymentMethod === "cod" ? <CodPayment order={order} /> : <DemoPayment order={order} />}
      </div>
      <OrderSummary order={order} />
    </section>
  );
}

function RazorpayPayment({ order }: { order: Order }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [scriptReady, setScriptReady] = useState(Boolean(window.Razorpay));
  const [error, setError] = useState("");
  const saved = useMemo(() => {
    const raw = sessionStorage.getItem(`razorpay:${order._id}`);
    return raw ? JSON.parse(raw) as { razorpayOrder: { id: string; amount: number; currency: string }; razorpayKeyId: string } : null;
  }, [order._id]);

  useEffect(() => {
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Unable to load Razorpay Checkout. Please check your network and try again.");
    document.body.appendChild(script);
  }, []);

  const verify = useMutation({
    mutationFn: (response: RazorpayCheckoutResponse) => api(`/api/orders/${order._id}/confirm`, { method: "POST", ...jsonBody(response) }),
    onSuccess: async () => {
      sessionStorage.removeItem(`razorpay:${order._id}`);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Payment verification failed")
  });

  function pay() {
    setError("");
    if (!saved?.razorpayKeyId || !order.razorpayOrderId) {
      setError("Razorpay order details are missing. Please return to checkout and place the order again.");
      return;
    }
    if (!window.Razorpay) {
      setError("Razorpay Checkout is still loading.");
      return;
    }

    const checkout = new window.Razorpay({
      key: saved.razorpayKeyId,
      amount: saved.razorpayOrder.amount,
      currency: saved.razorpayOrder.currency || "INR",
      name: "SangraH",
      description: order.orderNumber,
      order_id: order.razorpayOrderId,
      prefill: {
        name: order.shippingAddress.fullName,
        contact: order.shippingAddress.phone
      },
      notes: {
        orderNumber: order.orderNumber
      },
      theme: {
        color: "#1b1b1b"
      },
      handler: (response: RazorpayCheckoutResponse) => verify.mutate(response)
    });

    checkout.on("payment.failed", () => setError("Payment failed or was cancelled. You can try again."));
    checkout.open();
  }

  return (
    <Card className="mt-8 p-6">
      <h2 className="font-display text-3xl">Razorpay Checkout</h2>
      <p className="mt-2 text-sm text-ink/60">Pay securely using UPI, cards, netbanking, or wallets.</p>
      {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button className="mt-6" variant="dark" onClick={pay} disabled={!scriptReady || verify.isPending}>
        <CreditCard className="h-4 w-4" />
        {verify.isPending ? "Verifying..." : `Pay ${money(order.total)}`}
      </Button>
    </Card>
  );
}

function DemoPayment({ order }: { order: Order }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [card, setCard] = useState({ number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" });
  const pay = useMutation({
    mutationFn: () => api(`/api/orders/${order._id}/demo-pay`, { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      navigate("/orders");
    }
  });

  return (
    <Card className="mt-8 p-6">
      <h2 className="font-display text-3xl">Demo card payment</h2>
      <p className="mt-2 text-sm text-ink/60">This simulates a successful card charge for local development.</p>
      <div className="mt-5 grid gap-4">
        <Input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Card number" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} placeholder="MM/YY" />
          <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="CVC" />
        </div>
        <Button variant="dark" onClick={() => pay.mutate()} disabled={pay.isPending}><CreditCard className="h-4 w-4" /> Pay {money(order.total)}</Button>
      </div>
    </Card>
  );
}

function CodPayment({ order }: { order: Order }) {
  return (
    <Card className="mt-8 p-6">
      <CheckCircle2 className="h-10 w-10 text-champagne" />
      <h2 className="mt-4 font-display text-3xl">Order placed</h2>
      <p className="mt-2 text-ink/60">Your order is confirmed for cash on delivery. Keep {money(order.total)} ready at delivery.</p>
      <Link href="/orders"><Button className="mt-5" variant="dark">View orders</Button></Link>
    </Card>
  );
}

function PaymentSuccess({ order }: { order: Order }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-champagne" />
      <h1 className="mt-5 font-display text-5xl">Payment received</h1>
      <p className="mt-3 text-ink/60">Order {order.orderNumber} is paid and ready for processing.</p>
      <Link href="/orders"><Button className="mt-8" variant="dark">View orders</Button></Link>
    </section>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <aside className="h-fit rounded-lg bg-ink p-6 text-white">
      <h2 className="font-display text-3xl">Summary</h2>
      <div className="mt-5 grid gap-4">
        {order.items.map((item) => (
          <div key={item.productId} className="flex gap-3">
            <img src={resolveImageUrl(item.image)} alt={item.name} className="h-16 w-16 rounded-md object-cover" />
            <div className="flex-1 text-sm"><p>{item.name}</p><p className="text-white/55">Qty {item.quantity}</p></div>
            <span className="text-sm">{money(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm">
        <Line label="Subtotal" value={money(order.subtotal)} />
        <Line label="Shipping" value={order.shipping === 0 ? "Free" : money(order.shipping)} />
        <Line label="GST" value={money(order.tax)} />
        <Line label="Total" value={money(order.total)} strong />
      </div>
    </aside>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "pt-3 text-lg font-semibold" : "text-white/75"}`}><span>{label}</span><span>{value}</span></div>;
}
