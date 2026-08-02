import { posts, user } from "@rag-blog/db/schema";
import { createPostSchema, updatePostSchema } from "@rag-blog/types";
import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { dbFromEnv } from "../lib/db";
import { newId } from "../lib/ids";
import type { AppVariables } from "../middleware/session";
import { requireAuth } from "../middleware/session";

export const postsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

postsRoutes.get("/", async (c) => {
	const db = dbFromEnv(c.env);
	const rows = await db
		.select({
			id: posts.id,
			title: posts.title,
			body: posts.body,
			authorId: posts.authorId,
			authorUsername: user.username,
			imageKey: posts.imageKey,
			ragIndexStatus: posts.ragIndexStatus,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
			likeCount: sql<number>`(select count(*)::int from likes where likes.post_id = ${posts.id})`,
			commentCount: sql<number>`(select count(*)::int from comments where comments.post_id = ${posts.id})`,
			shareCount: sql<number>`(select count(*)::int from shares where shares.post_id = ${posts.id})`,
		})
		.from(posts)
		.leftJoin(user, eq(posts.authorId, user.id))
		.orderBy(desc(posts.createdAt));

	return c.json({
		posts: rows.map((r) => ({
			...r,
			imageUrl:
				r.imageKey && c.env.R2_PUBLIC_BASE_URL ? `${c.env.R2_PUBLIC_BASE_URL}/${r.imageKey}` : null,
			createdAt: r.createdAt.toISOString(),
			updatedAt: r.updatedAt.toISOString(),
		})),
	});
});

postsRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	const db = dbFromEnv(c.env);
	const [row] = await db
		.select({
			id: posts.id,
			title: posts.title,
			body: posts.body,
			authorId: posts.authorId,
			authorUsername: user.username,
			imageKey: posts.imageKey,
			ragIndexStatus: posts.ragIndexStatus,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
			likeCount: sql<number>`(select count(*)::int from likes where likes.post_id = ${posts.id})`,
			commentCount: sql<number>`(select count(*)::int from comments where comments.post_id = ${posts.id})`,
			shareCount: sql<number>`(select count(*)::int from shares where shares.post_id = ${posts.id})`,
		})
		.from(posts)
		.leftJoin(user, eq(posts.authorId, user.id))
		.where(eq(posts.id, id))
		.limit(1);

	if (!row) return c.json({ error: "Not found" }, 404);

	return c.json({
		post: {
			...row,
			imageUrl:
				row.imageKey && c.env.R2_PUBLIC_BASE_URL
					? `${c.env.R2_PUBLIC_BASE_URL}/${row.imageKey}`
					: null,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		},
	});
});

postsRoutes.post("/", requireAuth, async (c) => {
	const body = await c.req.json();
	const parsed = createPostSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
	}

	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	const db = dbFromEnv(c.env);
	const id = newId();
	const now = new Date();

	await db.insert(posts).values({
		id,
		title: parsed.data.title,
		body: parsed.data.body,
		authorId: authUser.id,
		imageKey: parsed.data.imageKey ?? null,
		ragIndexStatus: "pending",
		createdAt: now,
		updatedAt: now,
	});

	await c.env.RAG_INDEX_QUEUE.send({ postId: id } satisfies RagIndexMessage);

	return c.json({ id }, 201);
});

postsRoutes.patch("/:id", requireAuth, async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const parsed = updatePostSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
	}

	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	const db = dbFromEnv(c.env);
	const [existing] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	if (!existing) return c.json({ error: "Not found" }, 404);
	if (existing.authorId !== authUser.id) return c.json({ error: "Forbidden" }, 403);

	const contentChanged =
		parsed.data.title !== undefined ||
		parsed.data.body !== undefined ||
		parsed.data.imageKey !== undefined;

	await db
		.update(posts)
		.set({
			...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
			...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
			...(parsed.data.imageKey !== undefined ? { imageKey: parsed.data.imageKey } : {}),
			...(contentChanged ? { ragIndexStatus: "pending" as const } : {}),
			updatedAt: new Date(),
		})
		.where(eq(posts.id, id));

	if (contentChanged) {
		await c.env.RAG_INDEX_QUEUE.send({ postId: id } satisfies RagIndexMessage);
	}

	const [updated] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	return c.json({
		post: {
			...updated,
			createdAt: updated?.createdAt.toISOString(),
			updatedAt: updated?.updatedAt.toISOString(),
		},
	});
});

postsRoutes.delete("/:id", requireAuth, async (c) => {
	const id = c.req.param("id");
	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	const db = dbFromEnv(c.env);
	const [existing] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	if (!existing) return c.json({ error: "Not found" }, 404);
	if (existing.authorId !== authUser.id) return c.json({ error: "Forbidden" }, 403);

	await db.delete(posts).where(and(eq(posts.id, id), eq(posts.authorId, authUser.id)));
	return c.json({ ok: true });
});
