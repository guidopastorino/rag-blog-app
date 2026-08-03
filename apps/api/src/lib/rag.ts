import type { Database } from "@rag-blog/db";
import { postChunks, posts } from "@rag-blog/db/schema";
import { cosineDistance, eq } from "drizzle-orm";
import { chunkText } from "./chunk";
import { newId } from "./ids";

const EMBED_MODEL = "@cf/baai/bge-large-en-v1.5";
const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
const SIMILARITY_THRESHOLD = 0.3;

export async function embedTexts(ai: Ai, texts: string[]): Promise<number[][]> {
	const result = await ai.run(EMBED_MODEL, { text: texts });
	const data = (result as { data?: number[][] }).data;
	if (!data || data.length !== texts.length) {
		throw new Error("Embedding model returned unexpected shape");
	}
	return data;
}

export async function indexPost(env: Env, db: Database, postId: string): Promise<void> {
	const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
	if (!post) {
		return;
	}

	try {
		const chunks = chunkText(`${post.title}\n\n${post.body}`);
		await db.delete(postChunks).where(eq(postChunks.postId, postId));

		if (chunks.length === 0) {
			await db
				.update(posts)
				.set({ ragIndexStatus: "ready", updatedAt: new Date() })
				.where(eq(posts.id, postId));
			return;
		}

		const embeddings = await embedTexts(env.AI, chunks);
		await db.insert(postChunks).values(
			chunks.map((content, chunkIndex) => ({
				id: newId(),
				postId,
				chunkIndex,
				content,
				embedding: embeddings[chunkIndex] ?? [],
			})),
		);

		await db
			.update(posts)
			.set({ ragIndexStatus: "ready", updatedAt: new Date() })
			.where(eq(posts.id, postId));
	} catch (err) {
		console.error("indexPost failed", postId, err);
		await db
			.update(posts)
			.set({ ragIndexStatus: "failed", updatedAt: new Date() })
			.where(eq(posts.id, postId));
		throw err;
	}
}

export async function answerPostQuestion(
	env: Env,
	db: Database,
	postId: string,
	question: string,
): Promise<{ status: "ok" | "not_ready" | "no_content"; answer: string }> {
	const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
	if (!post) {
		throw new Error("NOT_FOUND");
	}
	if (post.ragIndexStatus !== "ready") {
		return {
			status: "not_ready",
			answer: "This post is not ready for Q&A yet. Try again after indexing completes.",
		};
	}

	const [queryEmbedding] = await embedTexts(env.AI, [question]);
	if (!queryEmbedding) {
		return { status: "no_content", answer: "Could not embed the question." };
	}

	const distance = cosineDistance(postChunks.embedding, queryEmbedding);
	const rows = await db
		.select({
			id: postChunks.id,
			content: postChunks.content,
			distance,
		})
		.from(postChunks)
		.where(eq(postChunks.postId, postId))
		.orderBy(distance)
		.limit(5);

	const relevant = rows.filter((r) => 1 - Number(r.distance) >= SIMILARITY_THRESHOLD);
	if (relevant.length === 0) {
		return {
			status: "no_content",
			answer: "I could not find supporting content in this post for that question.",
		};
	}

	const context = relevant.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
	const prompt = `You answer questions using ONLY the provided post excerpts. If the excerpts do not support an answer, say you cannot find supporting content in the post. Do not invent facts.

Excerpts:
${context}

Question: ${question}

Answer:`;

	const result = await env.AI.run(CHAT_MODEL, {
		messages: [
			{
				role: "system",
				content: "You are a careful assistant that only uses the provided post excerpts.",
			},
			{ role: "user", content: prompt },
		],
	});

	const answer =
		typeof result === "object" && result && "response" in result
			? String((result as { response: string }).response)
			: String(result);

	return { status: "ok", answer };
}
