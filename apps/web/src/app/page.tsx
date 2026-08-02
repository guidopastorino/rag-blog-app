"use client";

import type { Post } from "@rag-blog/types";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function HomePage() {
	const { data, isLoading, error } = useQuery({
		queryKey: ["posts"],
		queryFn: () => apiFetch<{ posts: Post[] }>("/api/posts"),
	});

	return (
		<section className="space-y-8">
			<div>
				<h1 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight">
					Latest posts
				</h1>
				<p className="mt-2 max-w-2xl text-[var(--muted)]">
					Read public posts, engage with the community, and ask the AI questions grounded in each
					article.
				</p>
			</div>

			{isLoading && <p className="text-[var(--muted)]">Loading posts…</p>}
			{error && <p className="text-red-700">{(error as Error).message}</p>}

			<ul className="space-y-4">
				{data?.posts.map((post) => (
					<li key={post.id} className="border-b border-zinc-200/80 pb-4">
						<Link href={`/posts/${post.id}`} className="group block">
							<h2 className="font-[family-name:var(--font-fraunces)] text-2xl group-hover:text-[var(--accent)]">
								{post.title}
							</h2>
							<p className="mt-1 line-clamp-2 text-[var(--muted)]">{post.body}</p>
							<p className="mt-2 text-xs text-[var(--muted)]">
								{post.authorUsername ?? "author"} · {post.likeCount ?? 0} likes ·{" "}
								{post.commentCount ?? 0} comments
							</p>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
