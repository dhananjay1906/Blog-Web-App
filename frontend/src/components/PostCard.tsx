import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/types";
import { Avatar } from "./Avatar";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/70">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {post.tags.map((t) => (
          <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="tag">
            {t}
          </Link>
        ))}
        {post.status === "draft" && <span className="tag bg-amber-100 text-amber-800">draft</span>}
      </div>

      <Link href={`/posts/${post.slug}`} className="flex-1">
        <h2 className="font-serif text-xl font-bold leading-snug group-hover:text-orange-700">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-stone-600">{post.excerpt}</p>
      </Link>

      <footer className="mt-5 flex items-center gap-2 whitespace-nowrap text-sm text-stone-500">
        <Avatar name={post.author.username} size={24} />
        <Link href={`/?author=${post.author.username}`} className="font-medium text-stone-700 hover:underline">
          {post.author.username}
        </Link>
        <span>·</span>
        <span>{formatDate(post.published_at ?? post.updated_at)}</span>
        <span className="ml-auto">{post.reading_time} min</span>
      </footer>
    </article>
  );
}
