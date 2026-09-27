import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (config: unknown) => void; renderButton: (el: HTMLElement, config: unknown) => void } } };
  }
}

export function AuthPage() {
  const [, navigate] = useLocation();
  const { user, login, signup, googleLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    api<{ clientId: string }>("/api/auth/google-client-id").then(({ clientId }) => {
      if (!clientId) return;
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => {
        window.google?.accounts.id.initialize({ client_id: clientId, callback: (res: { credential: string }) => googleLogin(res.credential).then(() => navigate("/")) });
        const target = document.getElementById("googleSignIn");
        if (target) window.google?.accounts.id.renderButton(target, { theme: "outline", size: "large", width: "320" });
      };
      document.body.appendChild(script);
    });
  }, [googleLogin, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (tab === "login") await login(form.email, form.password);
      else await signup(form.username, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    }
  }

  return (
    <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-champagne">Private access</p>
        <h1 className="mt-2 font-display text-5xl">Create your SangraH account.</h1>
        <p className="mt-5 leading-8 text-ink/65">Save favorite pieces, preserve your cart, and leave reviews for the objects you bring home.</p>
      </div>
      <Card className="p-6">
        <div className="grid grid-cols-2 rounded-md bg-porcelain p-1">
          <button className={`rounded-md py-3 text-sm font-semibold ${tab === "login" ? "bg-white shadow" : ""}`} onClick={() => setTab("login")}>Login</button>
          <button className={`rounded-md py-3 text-sm font-semibold ${tab === "signup" ? "bg-white shadow" : ""}`} onClick={() => setTab("signup")}>Signup</button>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          {tab === "signup" && <Input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />}
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="dark">{tab === "login" ? "Login" : "Create account"}</Button>
        </form>
        <div className="my-6 h-px bg-ink/10" />
        <div id="googleSignIn" className="flex justify-center" />
      </Card>
    </section>
  );
}
