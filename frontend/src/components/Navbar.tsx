"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar } from "./Avatar";

export function Navbar() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
          Inkwell<span className="text-orange-600">.</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 text-sm">
          {!ready ? null : user ? (
            <>
              <Link href="/write" className="btn-primary">
                Write
              </Link>
              <Link href="/me" className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-stone-200/60">
                <Avatar name={user.username} size={28} />
                <span className="hidden font-medium sm:inline">{user.username}</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                  router.refresh();
                }}
                className="btn-ghost"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
