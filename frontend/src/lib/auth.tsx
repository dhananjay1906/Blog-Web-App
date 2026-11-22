"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokens } from "./client-api";
import type { User } from "./types";

type AuthState = {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokens.hasSession()) {
      setReady(true);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => tokens.clear())
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api<{ access: string; refresh: string }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    tokens.save(data.access, data.refresh);
    setUser(await api<User>("/auth/me"));
  }, []);

  const register = useCallback(
    async (username: string, password: string, email?: string) => {
      await api("/auth/register", { method: "POST", body: JSON.stringify({ username, password, email }) });
      await login(username, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, ready, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
