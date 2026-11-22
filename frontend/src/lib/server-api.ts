import "server-only";
import type { Page, Post, PostSummary, Tag } from "./types";

// Server components talk to Django directly; the browser goes through the /api rewrite.
const API_URL = process.env.API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  return res.json();
}

export function getPosts(params: { q?: string; tag?: string; page?: string; author?: string }) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("search", params.q);
  if (params.tag) qs.set("tag", params.tag);
  if (params.author) qs.set("author", params.author);
  if (params.page && params.page !== "1") qs.set("page", params.page);
  return get<Page<PostSummary>>(`/api/posts?${qs}`);
}

export const getPost = (slug: string) => get<Post>(`/api/posts/${encodeURIComponent(slug)}`);

export const getTags = () => get<Tag[]>("/api/tags");
