"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { Avatar } from "./Avatar";

export function Comments({ slug, postAuthorId }: { slug: string; postAuthorId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api<Comment[]>(`/posts/${slug}/comments`).then(setComments).catch(() => setComments([]));
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const created = await api<Comment>(`/posts/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      setComments((c) => [...(c ?? []), created]);
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post your comment.");
    } finally {
      setPosting(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this comment?")) return;
    await api(`/comments/${id}`, { method: "DELETE" });
    setComments((c) => c?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <section className="mt-14 border-t border-stone-200 pt-10" aria-labelledby="comments-title">
      <h2 id="comments-title" className="font-serif text-2xl font-bold">
        Comments {comments && comments.length > 0 && <span className="text-stone-400">({comments.length})</span>}
      </h2>

      {user ? (
        <form onSubmit={submit} className="mt-5">
          <textarea
            aria-label="Write a comment"
            className="input min-h-[90px] resize-y"
            placeholder="Share your thoughts..."
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary mt-3" disabled={posting || !text.trim()}>
            {posting ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-stone-600">
          <Link href="/login" className="font-medium text-orange-700 underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="mt-8 space-y-6">
        {comments === null && <li className="text-stone-400">Loading comments...</li>}
        {comments?.length === 0 && <li className="text-stone-500">No comments yet. Be the first.</li>}
        {comments?.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar name={c.author.username} size={34} />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{c.author.username}</span>
                {c.author.id === postAuthorId && <span className="tag">author</span>}
                <span className="text-stone-400">{formatDate(c.created_at)}</span>
                {user && (user.id === c.author.id || user.id === postAuthorId) && (
                  <button onClick={() => remove(c.id)} className="ml-auto text-xs text-stone-400 hover:text-red-600">
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed text-stone-700">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
