import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, jsonBody } from "@/lib/api";
import type { User } from "@shared/schema";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    api<{ user: User | null }>("/api/auth/me").then((res) => setUser(res.user)).finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const res = await api<{ user: User }>("/api/auth/login", { method: "POST", ...jsonBody({ email, password }) });
      setUser(res.user);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    async signup(username, email, password) {
      const res = await api<{ user: User }>("/api/auth/signup", { method: "POST", ...jsonBody({ username, email, password }) });
      setUser(res.user);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    async googleLogin(credential) {
      const res = await api<{ user: User }>("/api/auth/google", { method: "POST", ...jsonBody({ credential }) });
      setUser(res.user);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    async logout() {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
      queryClient.clear();
    }
  }), [user, loading, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
