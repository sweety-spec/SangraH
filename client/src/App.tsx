"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";
import { AuthProvider } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Shop } from "@/pages/Shop";
import { ProductDetail } from "@/pages/ProductDetail";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { OrderDetail } from "@/pages/OrderDetail";
import { Orders } from "@/pages/Orders";
import { Payment } from "@/pages/Payment";
import { Wishlist } from "@/pages/Wishlist";
import { AuthPage } from "@/pages/Auth";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Admin } from "@/pages/Admin";

const queryClient = new QueryClient();

export function ClientApp() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/shop" component={Shop} />
              <Route path="/product/:slug">{({ slug }) => <ProductDetail slug={slug} />}</Route>
              <Route path="/cart" component={Cart} />
              <Route path="/checkout" component={Checkout} />
              <Route path="/payment/:id">{({ id }) => <Payment id={id} />}</Route>
              <Route path="/orders/:id">{({ id }) => <OrderDetail id={id} />}</Route>
              <Route path="/orders" component={Orders} />
              <Route path="/wishlist" component={Wishlist} />
              <Route path="/auth" component={AuthPage} />
              <Route path="/about" component={About} />
              <Route path="/contact" component={Contact} />
              <Route path="/admin" component={Admin} />
              <Route>
                <div className="mx-auto max-w-7xl px-4 py-24">Page not found.</div>
              </Route>
            </Switch>
          </Layout>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}
