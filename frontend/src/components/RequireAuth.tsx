"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [ready, user, router]);

  if (!ready || !user) return <p className="py-20 text-center text-stone-400">Loading...</p>;
  return <>{children}</>;
}
