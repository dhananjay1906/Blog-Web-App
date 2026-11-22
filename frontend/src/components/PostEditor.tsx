"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client-api";
import type { Post } from "@/lib/types";
import { Markdown } from "./Markdown";

type Props = { post?: Post };

export function PostEditor({ post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
  const canSave = title.trim() && body.trim() && !saving;

  async function save(status: "draft" | "published") {
    if (tagList.length > 5) return setError("Use at most 5 tags.");
    setSaving(true);
    setError(null);
    try {
      const payload = JSON.stringify({ title, body, status, tag_names: tagList });
      const saved = post
        ? await api<Post>(`/posts/${post.slug}`, { method: "PATCH", body: payload })
        : await api<Post>("/posts", { method: "POST", body: payload });
      router.push(status === "draft" ? "/me" : `/posts/${saved.slug}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <input
        aria-label="Title"
        className="w-full bg-transparent font-serif text-4xl font-bold outline-none placeholder:text-stone-300"
        placeholder="Post title"
        maxLength={150}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        aria-label="Tags"
        className="input"
        placeholder="Tags, comma separated (e.g. django, postgres)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="flex border-b border-stone-200 text-sm">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 capitalize ${tab === t ? "border-b-2 border-orange-600 font-semibold" : "text-stone-500"}`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto self-center pr-4 text-xs text-stone-400">Markdown supported</span>
        </div>
        {tab === "write" ? (
          <textarea
            aria-label="Body"
            className="min-h-[360px] w-full resize-y p-5 font-mono text-[15px] leading-relaxed outline-none"
            placeholder={"Write your post...\n\n## Use headings\n- lists, **bold**, `code` and more"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        ) : (
          <div className="min-h-[360px] p-6">
            {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-stone-400">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" disabled={!canSave} onClick={() => save("published")}>
          {post?.status === "published" ? "Update post" : "Publish"}
        </button>
        <button className="btn-secondary" disabled={!canSave} onClick={() => save("draft")}>
          {post?.status === "published" ? "Move to drafts" : "Save draft"}
        </button>
        <button className="btn-ghost" type="button" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </div>
  );
}
