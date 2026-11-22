export type User = { id: number; username: string };

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  author: User;
  tags: string[];
  status: "draft" | "published";
  reading_time: number;
  comment_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = PostSummary & { body: string };

export type Comment = { id: number; author: User; body: string; created_at: string };

export type Tag = { name: string; slug: string; post_count: number };

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
