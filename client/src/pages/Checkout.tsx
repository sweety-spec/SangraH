import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CreditCard, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, jsonBody } from "@/lib/api";
import { money, resolveImageUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { Order, Product } from "@shared/schema";

type CartRow = { _id: string; quantity: number; productId: Product & { _id: string } };

export function Checkout() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const { data: rows = [] } = useQuery<CartRow[]>({ queryKey: ["cart"], queryFn: () => api("/api/cart") });
  const { data: paymentConfig } = useQuery<{ razorpayEnabled: boolean; razorpayKeyId: string }>({ queryKey: ["payment-config"], queryFn: () => api("/api/payments/config") });
  const [paymentMethod, setPaymentMethod] = useState<"demo_card" | "cod" | "razorpay">("demo_card");
  const [address, setAddress] = useState({
    fullName: user?.username || "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  });
  const subtotal = rows.reduce((sum, row) => sum + row.productId.price * row.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 249;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const checkout = useMutation({
    mutationFn: () => api<{ order: Order; razorpayOrder?: { id: string; amount: number; currency: string }; razorpayKeyId?: string }>("/api/checkout", { method: "POST", ...jsonBody({ shippingAddress: address, paymentMethod }) }),
    onSuccess: ({ order, razorpayOrder, razorpayKeyId }) => {
      if (razorpayOrder && razorpayKeyId) sessionStorage.setItem(`razorpay:${order._id}`, JSON.stringify({ razorpayOrder, razorpayKeyId }));
      navigate(`/payment/${order._id}`);
    }
  });

  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-champagne">Secure checkout</p>
        <h1 className="mt-2 font-display text-5xl">Delivery & payment</h1>
        <Card className="mt-8 p-6">
          <h2 className="font-display text-3xl">Shipping address</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input placeholder="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} required />
            <Input placeholder="Phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required />
            <Input className="sm:col-span-2" placeholder="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} required />
            <Input className="sm:col-span-2" placeholder="Address line 2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
            <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
            <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required />
            <Input placeholder="Postal code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} required />
            <Input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required />
          </div>
        </Card>
        <Card className="mt-6 p-6">
          <h2 className="font-display text-3xl">Payment method</h2>
          <div className="mt-5 grid gap-3">
            <PaymentOption active={paymentMethod === "demo_card"} title="Demo card" note="Complete a test payment locally without Razorpay keys." icon={<CreditCard />} onClick={() => setPaymentMethod("demo_card")} />
            {paymentConfig?.razorpayEnabled && <PaymentOption active={paymentMethod === "razorpay"} title="Razorpay" note="Pay by UPI, cards, netbanking, and wallets." icon={<CreditCard />} onClick={() => setPaymentMethod("razorpay")} />}
            <PaymentOption active={paymentMethod === "cod"} title="Cash on delivery" note="Pay when your order arrives." icon={<Truck />} onClick={() => setPaymentMethod("cod")} />
          </div>
        </Card>
      </div>
      <aside className="h-fit rounded-lg bg-ink p-6 text-white">
        <h2 className="font-display text-3xl">Order summary</h2>
        <div className="mt-5 grid gap-4">
          {rows.map((row) => (
            <div key={row._id} className="flex gap-3">
              <img src={resolveImageUrl(row.productId.image)} className="h-16 w-16 rounded-md object-cover" alt={row.productId.name} />
              <div className="flex-1 text-sm">
                <p>{row.productId.name}</p>
                <p className="text-white/55">Qty {row.quantity}</p>
              </div>
              <span className="text-sm">{money(row.productId.price * row.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 border-t border-white/15 pt-5 text-sm">
          <Line label="Subtotal" value={money(subtotal)} />
          <Line label="Shipping" value={shipping === 0 ? "Free" : money(shipping)} />
          <Line label="GST" value={money(tax)} />
          <Line label="Total" value={money(total)} strong />
        </div>
        {checkout.error && <p className="mt-4 text-sm text-red-200">{checkout.error.message}</p>}
        <Button className="mt-6 w-full" onClick={() => checkout.mutate()} disabled={!rows.length || checkout.isPending}>
          {checkout.isPending ? "Creating order..." : "Place order"}
        </Button>
      </aside>
    </section>
  );
}

function PaymentOption({ active, title, note, icon, onClick }: { active: boolean; title: string; note: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-4 rounded-lg border p-4 text-left transition ${active ? "border-champagne bg-champagne/10" : "border-ink/10 hover:border-champagne/60"}`}>
      <span className="text-champagne [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span><span className="block font-semibold">{title}</span><span className="text-sm text-ink/55">{note}</span></span>
    </button>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex justify-between ${strong ? "pt-3 text-lg font-semibold" : "text-white/75"}`}><span>{label}</span><span>{value}</span></div>;
}
