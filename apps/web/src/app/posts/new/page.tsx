"use client";

import { createPostSchema } from "@rag-blog/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";

export default function NewPostPage() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function onSubmit(formData: FormData) {
		setError(null);
		setPending(true);
		try {
			let imageKey: string | undefined;
			const file = formData.get("image");
			if (file instanceof File && file.size > 0) {
				const upload = new FormData();
				upload.set("file", file);
				const uploaded = await apiFetch<{ key: string }>("/api/images/upload", {
					method: "POST",
					body: upload,
					headers: {},
				});
				imageKey = uploaded.key;
			}

			const parsed = createPostSchema.safeParse({
				title: String(formData.get("title") ?? ""),
				body: String(formData.get("body") ?? ""),
				imageKey,
			});
			if (!parsed.success) {
				setError("Title and body are required");
				return;
			}

			const created = await apiFetch<{ id: string }>("/api/posts", {
				method: "POST",
				body: JSON.stringify(parsed.data),
			});
			router.push(`/posts/${created.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create post");
		} finally {
			setPending(false);
		}
	}

	return (
		<section className="mx-auto max-w-2xl space-y-6">
			<h1 className="font-[family-name:var(--font-fraunces)] text-3xl">New post</h1>
			<form action={onSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="title">Title</Label>
					<Input id="title" name="title" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="body">Body</Label>
					<Textarea id="body" name="body" required />
				</div>
				<div className="space-y-2">
					<Label htmlFor="image">Image (optional)</Label>
					<Input id="image" name="image" type="file" accept="image/*" />
				</div>
				{error && <p className="text-sm text-red-700">{error}</p>}
				<Button type="submit" disabled={pending}>
					{pending ? "Publishing…" : "Publish"}
				</Button>
			</form>
		</section>
	);
}
