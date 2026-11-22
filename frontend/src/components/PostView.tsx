"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Post } from "@/lib/types";
import { Avatar } from "./Avatar";
import { Comments } from "./Comments";
import { Markdown } from "./Markdown";

export function PostView({ post }: { post: Post }) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isAuthor = user?.id === post.author.id;

  async function remove() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    await api(`/posts/${post.slug}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <article className="mx-auto max-w-3xl">
      {post.status === "draft" && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
          This is a draft. Only you can see it.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-1.5">
        {post.tags.map((t) => (
          <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="tag">
            {t}
          </Link>
        ))}
      </div>

      <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-6 text-sm text-stone-500">
        <Avatar name={post.author.username} size={36} />
        <div>
          <Link href={`/?author=${post.author.username}`} className="font-semibold text-stone-800 hover:underline">
            {post.author.username}
          </Link>
          <div>
            {formatDate(post.published_at ?? post.updated_at)} · {post.reading_time} min read
          </div>
        </div>
        {isAuthor && (
          <div className="ml-auto flex gap-2">
            <Link href={`/posts/${post.slug}/edit`} className="btn-secondary">
              Edit
            </Link>
            <button onClick={remove} disabled={deleting} className="btn-danger">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Markdown>{post.body}</Markdown>
      </div>

      <Comments slug={post.slug} postAuthorId={post.author.id} />
    </article>
  );
}
