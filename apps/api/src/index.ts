import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";
import type { AppVariables } from "./middleware/session";
import { sessionMiddleware } from "./middleware/session";
import { handleRagIndexBatch } from "./queue";
import { engagementRoutes } from "./routes/engagement";
import { imagesRoutes } from "./routes/images";
import { postsRoutes } from "./routes/posts";
import { ragRoutes } from "./routes/rag";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", async (c, next) => {
	const corsMiddleware = cors({
		origin: c.env.WEB_ORIGIN,
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
	});
	return corsMiddleware(c, next);
});

app.use("*", async (c, next) => {
	c.set("auth", createAuth(c.env));
	await next();
});

app.use("*", sessionMiddleware);

app.get("/health", (c) => c.json({ ok: true }));

app.on(["GET", "POST"], "/api/auth/*", (c) => {
	const auth = c.get("auth");
	return auth.handler(c.req.raw);
});

app.get("/api/me", (c) => {
	const user = c.get("user");
	if (!user) return c.json({ user: null }, 401);
	return c.json({ user });
});

app.route("/api/posts", postsRoutes);
app.route("/api/posts", engagementRoutes);
app.route("/api/posts", ragRoutes);
app.route("/api/images", imagesRoutes);

export default {
	fetch: app.fetch,
	async queue(batch: MessageBatch<RagIndexMessage>, env: Env) {
		await handleRagIndexBatch(batch, env);
	},
};
