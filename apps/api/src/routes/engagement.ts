import { comments, likes, posts, shares, user } from "@rag-blog/db/schema";
import { createCommentSchema } from "@rag-blog/types";
import { and, asc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { dbFromEnv } from "../lib/db";
import { newId } from "../lib/ids";
import type { AppVariables } from "../middleware/session";
import { requireAuth } from "../middleware/session";

export const engagementRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

async function requirePost(env: Env, postId: string) {
	const db = dbFromEnv(env);
	const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
	return post ?? null;
}

engagementRoutes.post("/:postId/like", requireAuth, async (c) => {
	const postId = c.req.param("postId");
	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	if (!(await requirePost(c.env, postId))) return c.json({ error: "Not found" }, 404);

	const db = dbFromEnv(c.env);
	const [existing] = await db
		.select()
		.from(likes)
		.where(and(eq(likes.postId, postId), eq(likes.userId, authUser.id)))
		.limit(1);

	if (!existing) {
		await db.insert(likes).values({
			id: newId(),
			postId,
			userId: authUser.id,
		});
	}

	const [{ count } = { count: 0 }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(likes)
		.where(eq(likes.postId, postId));

	return c.json({ liked: true, likeCount: count });
});

engagementRoutes.delete("/:postId/like", requireAuth, async (c) => {
	const postId = c.req.param("postId");
	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	if (!(await requirePost(c.env, postId))) return c.json({ error: "Not found" }, 404);

	const db = dbFromEnv(c.env);
	await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, authUser.id)));

	const [{ count } = { count: 0 }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(likes)
		.where(eq(likes.postId, postId));

	return c.json({ liked: false, likeCount: count });
});

engagementRoutes.post("/:postId/share", async (c) => {
	const postId = c.req.param("postId");
	if (!(await requirePost(c.env, postId))) return c.json({ error: "Not found" }, 404);

	const authUser = c.get("user");
	const db = dbFromEnv(c.env);
	await db.insert(shares).values({
		id: newId(),
		postId,
		userId: authUser?.id ?? null,
	});

	const [{ count } = { count: 0 }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(shares)
		.where(eq(shares.postId, postId));

	const shareUrl = `${c.env.APP_URL}/posts/${postId}`;
	return c.json({ postId, shareUrl, shareCount: count });
});

engagementRoutes.get("/:postId/comments", async (c) => {
	const postId = c.req.param("postId");
	if (!(await requirePost(c.env, postId))) return c.json({ error: "Not found" }, 404);

	const db = dbFromEnv(c.env);
	const rows = await db
		.select({
			id: comments.id,
			postId: comments.postId,
			authorId: comments.authorId,
			authorUsername: user.username,
			body: comments.body,
			createdAt: comments.createdAt,
		})
		.from(comments)
		.leftJoin(user, eq(comments.authorId, user.id))
		.where(eq(comments.postId, postId))
		.orderBy(asc(comments.createdAt));

	return c.json({
		comments: rows.map((r) => ({
			...r,
			createdAt: r.createdAt.toISOString(),
		})),
	});
});

engagementRoutes.post("/:postId/comments", requireAuth, async (c) => {
	const postId = c.req.param("postId");
	const authUser = c.get("user");
	if (!authUser) return c.json({ error: "Unauthorized" }, 401);

	if (!(await requirePost(c.env, postId))) return c.json({ error: "Not found" }, 404);

	const body = await c.req.json();
	const parsed = createCommentSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
	}

	const db = dbFromEnv(c.env);
	const id = newId();
	const createdAt = new Date();
	await db.insert(comments).values({
		id,
		postId,
		authorId: authUser.id,
		body: parsed.data.body,
		createdAt,
	});

	return c.json(
		{
			comment: {
				id,
				postId,
				authorId: authUser.id,
				authorUsername: authUser.username ?? undefined,
				body: parsed.data.body,
				createdAt: createdAt.toISOString(),
			},
		},
		201,
	);
});
