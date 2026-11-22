"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login(username, password);
      else await register(username, password, email || undefined);
      router.push(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Something went wrong.";
      setError(err instanceof ApiError && err.status === 401 ? "Wrong username or password." : msg);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="font-serif text-4xl font-bold">{isLogin ? "Welcome back" : "Join Inkwell"}</h1>
      <p className="mt-2 text-stone-600">{isLogin ? "Log in to write and comment." : "Create an account to start writing."}</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Username</span>
          <input className="input" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        {!isLogin && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Email <span className="font-normal text-stone-400">(optional)</span>
            </span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            className="input"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={isLogin ? undefined : 8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-orange-700 underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
