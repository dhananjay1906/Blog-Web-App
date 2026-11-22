import type { Metadata } from "next";
import { DraftOrNotFound } from "@/components/DraftOrNotFound";
import { PostView } from "@/components/PostView";
import { getPost } from "@/lib/server-api";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, description: post.body.slice(0, 150) } : { title: "Post" };
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  // Published posts render on the server. Drafts only exist for their author,
  // so if the server can't see it we let the browser try with the user's token.
  return post ? <PostView post={post} /> : <DraftOrNotFound slug={slug} />;
}
