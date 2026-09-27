import { Link, useLocation } from "wouter";
import { Heart, LogOut, Menu, PackageCheck, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Product } from "@shared/schema";

const nav = [
  ["Home", "/"],
  ["Shop", "/shop"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Admin", "/admin"]
];

type CartRow = { _id: string; quantity: number; productId: Product & { _id: string } };
type WishRow = { _id: string; productId: Product & { _id: string } };

export function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: cartRows = [] } = useQuery<CartRow[]>({ queryKey: ["cart"], queryFn: () => api("/api/cart") });
  const { data: wishRows = [] } = useQuery<WishRow[]>({ queryKey: ["wishlist"], queryFn: () => api("/api/wishlist") });
  const cartCount = cartRows.filter((r) => Boolean(r?.productId)).reduce((sum, row) => sum + row.quantity, 0);
  const wishCount = wishRows.filter((r) => Boolean(r?.productId)).length;

  return (
    <div className="min-h-screen bg-porcelain text-ink">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-porcelain/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-2xl font-bold tracking-normal">SangraH</Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className={`text-sm font-medium transition hover:text-champagne ${location === href ? "text-champagne" : ""}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <WishlistLink count={wishCount} />
            <CartLink count={cartCount} />
            {user && <Link href="/orders" aria-label="Orders"><PackageCheck className="h-5 w-5" /></Link>}
            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-ink/10 px-3 py-2">
                {user.avatar ? <img src={user.avatar} className="h-7 w-7 rounded-full" /> : <UserRound className="h-5 w-5" />}
                <span className="max-w-28 truncate text-sm">{user.username}</span>
                <button onClick={logout} aria-label="Logout"><LogOut className="h-4 w-4" /></button>
              </div>
            ) : (
              <Link href="/auth"><Button variant="dark">Login</Button></Link>
            )}
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-ink/10 px-4 pb-5 md:hidden">
            <div className="flex flex-col gap-3 pt-4">
              {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
              <Link href="/wishlist">Wishlist {wishCount > 0 && `(${wishCount})`}</Link>
              <Link href="/cart">Cart {cartCount > 0 && `(${cartCount})`}</Link>
              {user && <Link href="/orders">Orders</Link>}
              {user ? <button className="text-left" onClick={logout}>Logout {user.username}</button> : <Link href="/auth">Login / Signup</Link>}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-ink/10 bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h3 className="font-display text-2xl">SangraH</h3>
            <p className="mt-3 text-sm text-white/70">Timeless treasures, modern essentials, and unique finds, thoughtfully brought together.</p>
          </div>
          <div className="text-sm text-white/70">WhatsApp: +91 99999 99999<br />Email: support@sangrah.com</div>
          <div className="text-sm text-white/70">Discover thoughtfully selected products for every taste, occasion, and lifestyle.</div>
        </div>
      </footer>
    </div>
  );
}

function WishlistLink({ count }: { count: number }) {
  return (
    <Link href="/wishlist" aria-label={`Wishlist with ${count} item${count === 1 ? "" : "s"}`} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/70">
      <Heart className={`h-5 w-5 transition-colors ${count > 0 ? "fill-champagne text-champagne" : ""}`} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-champagne px-1.5 text-[11px] font-bold text-ink shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function CartLink({ count }: { count: number }) {
  return (
    <Link href="/cart" aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`} className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/70">
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-champagne px-1.5 text-[11px] font-bold text-ink shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
