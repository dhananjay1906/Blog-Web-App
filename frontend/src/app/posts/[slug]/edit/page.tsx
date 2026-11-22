"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NotFoundMessage } from "@/components/DraftOrNotFound";
import { PostEditor } from "@/components/PostEditor";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client-api";
import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

function EditInner() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    api<Post>(`/posts/${slug}`).then(setPost).catch(() => setPost(null));
  }, [slug]);

  if (post === undefined) return <p className="py-20 text-center text-stone-400">Loading...</p>;
  if (!post || post.author.id !== user?.id) return <NotFoundMessage />;
  return (
    <div className="mx-auto max-w-3xl">
      <PostEditor post={post} />
    </div>
  );
}

export default function EditPage() {
  return (
    <RequireAuth>
      <EditInner />
    </RequireAuth>
  );
}
