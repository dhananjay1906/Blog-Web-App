"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";
import { PostView } from "./PostView";

export function DraftOrNotFound({ slug }: { slug: string }) {
  const { user, ready } = useAuth();
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    if (!user) return setPost(null);
    api<Post>(`/posts/${slug}`).then(setPost).catch(() => setPost(null));
  }, [ready, user, slug]);

  if (post === undefined) return <p className="py-20 text-center text-stone-400">Loading...</p>;
  if (post) return <PostView post={post} />;
  return <NotFoundMessage />;
}

export function NotFoundMessage() {
  return (
    <div className="py-24 text-center">
      <p className="font-serif text-5xl font-bold">404</p>
      <p className="mt-3 text-stone-600">That post doesn&apos;t exist, or it was deleted.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to all posts
      </Link>
    </div>
  );
}
