"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";
import type { Page, PostSummary } from "@/lib/types";

function MyPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    api<Page<PostSummary>>("/posts?mine=true&page_size=100").then((p) => setPosts(p.results));
  }, []);

  const shown = posts?.filter((p) => filter === "all" || p.status === filter) ?? [];
  const drafts = posts?.filter((p) => p.status === "draft").length ?? 0;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold">Your posts</h1>
          <p className="mt-1 text-stone-600">
            Signed in as <b>{user?.username}</b> · {posts?.length ?? 0} posts, {drafts} draft{drafts === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/write" className="btn-primary ml-auto">
          New post
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tag capitalize ${filter === f ? "bg-stone-900 text-white hover:bg-stone-800 hover:text-white" : ""}`}
          >
            {f === "draft" ? "drafts" : f}
          </button>
        ))}
      </div>

      {posts === null ? (
        <p className="text-stone-400">Loading...</p>
      ) : shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-500">No posts here yet.</p>
      )}
    </>
  );
}

export default function MePage() {
  return (
    <RequireAuth>
      <MyPosts />
    </RequireAuth>
  );
}
