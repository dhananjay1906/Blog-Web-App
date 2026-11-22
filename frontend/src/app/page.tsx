import Link from "next/link";
import { Suspense } from "react";
import { PostCard } from "@/components/PostCard";
import { SearchBar } from "@/components/SearchBar";
import { getPosts, getTags } from "@/lib/server-api";

type SearchParams = Promise<{ q?: string; tag?: string; page?: string; author?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const [posts, tags] = await Promise.all([getPosts(params), getTags()]);
  const page = Number(params.page ?? 1);
  const filtered = params.q || params.tag || params.author;

  const pageLink = (n: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    qs.set("page", String(n));
    return `/?${qs}`;
  };

  return (
    <>
      <section className="mb-10">
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
          Stories, notes and <span className="text-orange-600">ideas</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-stone-600">
          Write in Markdown, tag your posts and talk about them in the comments.
        </p>
        <div className="mt-6">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      {tags && tags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Link href="/" className={`tag ${!params.tag ? "bg-stone-900 text-white hover:bg-stone-800 hover:text-white" : ""}`}>
            all
          </Link>
          {tags.map((t) => (
            <Link
              key={t.slug}
              href={`/?tag=${t.slug}`}
              className={`tag ${params.tag === t.slug ? "bg-stone-900 text-white hover:bg-stone-800 hover:text-white" : ""}`}
            >
              {t.name} <span className="opacity-60">{t.post_count}</span>
            </Link>
          ))}
        </div>
      )}

      {filtered && (
        <p className="mb-6 text-stone-600">
          {posts?.count ?? 0} result{posts?.count === 1 ? "" : "s"}
          {params.q && <> for “{params.q}”</>}
          {params.tag && <> tagged <b>{params.tag}</b></>}
          {params.author && <> by <b>{params.author}</b></>}
          {" · "}
          <Link href="/" className="text-orange-700 underline">
            clear
          </Link>
        </p>
      )}

      {posts && posts.results.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.results.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center">
          <p className="font-serif text-2xl">Nothing here yet.</p>
          <p className="mt-2 text-stone-500">
            <Link href="/write" className="text-orange-700 underline">
              Write the first post
            </Link>
          </p>
        </div>
      )}

      {posts && (posts.next || posts.previous) && (
        <nav className="mt-10 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
          {posts.previous ? <Link href={pageLink(page - 1)} className="btn-secondary">← Newer</Link> : <span />}
          <span className="text-stone-500">Page {page} of {Math.ceil(posts.count / 9)}</span>
          {posts.next && <Link href={pageLink(page + 1)} className="btn-secondary">Older →</Link>}
        </nav>
      )}
    </>
  );
}
