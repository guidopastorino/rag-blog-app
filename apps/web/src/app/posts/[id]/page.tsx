"use client";

import type { AskPostAnswer, Comment, Post } from "@rag-blog/types";
import { askPostQuestionSchema, createCommentSchema } from "@rag-blog/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export default function PostDetailPage() {
	const params = useParams<{ id: string }>();
	const postId = params.id;
	const qc = useQueryClient();
	const { data: session } = authClient.useSession();
	const [comment, setComment] = useState("");
	const [question, setQuestion] = useState("");
	const [answer, setAnswer] = useState<AskPostAnswer | null>(null);
	const [askError, setAskError] = useState<string | null>(null);

	const postQuery = useQuery({
		queryKey: ["post", postId],
		queryFn: () => apiFetch<{ post: Post }>(`/api/posts/${postId}`),
	});

	const commentsQuery = useQuery({
		queryKey: ["comments", postId],
		queryFn: () => apiFetch<{ comments: Comment[] }>(`/api/posts/${postId}/comments`),
	});

	const likeMutation = useMutation({
		mutationFn: () =>
			apiFetch<{ liked: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
				method: "POST",
			}),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["post", postId] }),
	});

	const shareMutation = useMutation({
		mutationFn: () =>
			apiFetch<{ shareUrl: string; shareCount: number }>(`/api/posts/${postId}/share`, {
				method: "POST",
			}),
		onSuccess: async (data) => {
			await navigator.clipboard.writeText(data.shareUrl);
			qc.invalidateQueries({ queryKey: ["post", postId] });
		},
	});

	const commentMutation = useMutation({
		mutationFn: (body: string) =>
			apiFetch(`/api/posts/${postId}/comments`, {
				method: "POST",
				body: JSON.stringify({ body }),
			}),
		onSuccess: () => {
			setComment("");
			qc.invalidateQueries({ queryKey: ["comments", postId] });
			qc.invalidateQueries({ queryKey: ["post", postId] });
		},
	});

	const askMutation = useMutation({
		mutationFn: (q: string) =>
			apiFetch<AskPostAnswer>(`/api/posts/${postId}/ask`, {
				method: "POST",
				body: JSON.stringify({ question: q }),
			}),
		onSuccess: (data) => {
			setAnswer(data);
			setAskError(null);
		},
		onError: (err) => setAskError(err instanceof Error ? err.message : "Ask failed"),
	});

	const post = postQuery.data?.post;

	if (postQuery.isLoading) return <p className="text-[var(--muted)]">Loading…</p>;
	if (postQuery.error || !post) {
		return <p className="text-red-700">{(postQuery.error as Error)?.message ?? "Not found"}</p>;
	}

	return (
		<article className="space-y-10">
			<header className="space-y-3">
				<p className="text-sm text-[var(--muted)]">
					{post.authorUsername ?? "author"} · index: {post.ragIndexStatus}
				</p>
				<h1 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight">
					{post.title}
				</h1>
				{post.imageUrl && (
					<img
						src={post.imageUrl}
						alt={post.title}
						className="max-h-96 w-full rounded-lg object-cover"
					/>
				)}
				<div className="flex flex-wrap gap-2">
					<Button
						size="sm"
						variant="outline"
						disabled={!session?.user || likeMutation.isPending}
						onClick={() => likeMutation.mutate()}
					>
						Like ({post.likeCount ?? 0})
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={shareMutation.isPending}
						onClick={() => shareMutation.mutate()}
					>
						Share ({post.shareCount ?? 0})
					</Button>
				</div>
			</header>

			<div className="whitespace-pre-wrap leading-7 text-[var(--foreground)]">{post.body}</div>

			<section className="space-y-4">
				<h2 className="font-[family-name:var(--font-fraunces)] text-2xl">Comments</h2>
				<ul className="space-y-3">
					{commentsQuery.data?.comments.map((c) => (
						<li key={c.id} className="border-b border-zinc-200/70 pb-3">
							<p className="text-sm text-[var(--muted)]">{c.authorUsername ?? c.authorId}</p>
							<p>{c.body}</p>
						</li>
					))}
				</ul>
				{session?.user ? (
					<form
						className="space-y-2"
						onSubmit={(e) => {
							e.preventDefault();
							const parsed = createCommentSchema.safeParse({ body: comment });
							if (!parsed.success) return;
							commentMutation.mutate(parsed.data.body);
						}}
					>
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Write a comment"
						/>
						<Button type="submit" size="sm" disabled={commentMutation.isPending}>
							Comment
						</Button>
					</form>
				) : (
					<p className="text-sm text-[var(--muted)]">Log in to comment.</p>
				)}
			</section>

			<section className="space-y-4 rounded-xl bg-white/70 p-5">
				<h2 className="font-[family-name:var(--font-fraunces)] text-2xl">Ask this post</h2>
				<p className="text-sm text-[var(--muted)]">
					Questions are answered only from this post&apos;s indexed content.
				</p>
				<form
					className="flex flex-col gap-2 sm:flex-row"
					onSubmit={(e) => {
						e.preventDefault();
						const parsed = askPostQuestionSchema.safeParse({ question });
						if (!parsed.success) return;
						askMutation.mutate(parsed.data.question);
					}}
				>
					<Input
						value={question}
						onChange={(e) => setQuestion(e.target.value)}
						placeholder="Ask a question about this post"
					/>
					<Button type="submit" disabled={askMutation.isPending}>
						{askMutation.isPending ? "Thinking…" : "Ask"}
					</Button>
				</form>
				{askError && <p className="text-sm text-red-700">{askError}</p>}
				{answer && (
					<div className="space-y-1">
						<p className="text-xs uppercase tracking-wide text-[var(--muted)]">
							Status: {answer.status}
						</p>
						<p className="leading-7">{answer.answer}</p>
					</div>
				)}
			</section>
		</article>
	);
}
