import { askPostQuestionSchema } from "@rag-blog/types";
import { Hono } from "hono";
import { dbFromEnv } from "../lib/db";
import { answerPostQuestion } from "../lib/rag";
import { checkRateLimit } from "../lib/rate-limit";
import type { AppVariables } from "../middleware/session";

const RAG_LIMIT = 20;
const RAG_WINDOW_SECONDS = 60 * 60;

export const ragRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

ragRoutes.post("/:postId/ask", async (c) => {
	const postId = c.req.param("postId");
	try {
		const body = await c.req.json();
		const parsed = askPostQuestionSchema.safeParse(body);
		if (!parsed.success) {
			return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
		}

		const ip = c.req.header("cf-connecting-ip") ?? c.req.header("x-forwarded-for") ?? "anon";
		const rateKey = `rag:${ip}`;
		const rate = await checkRateLimit(c.env.RATE_LIMIT, rateKey, RAG_LIMIT, RAG_WINDOW_SECONDS);
		if (!rate.allowed) {
			return c.json({ error: "Rate limit exceeded" }, 429);
		}

		const db = dbFromEnv(c.env);
		const result = await answerPostQuestion(c.env, db, postId, parsed.data.question);
		const statusCode = result.status === "not_ready" ? 409 : 200;
		return c.json(
			{
				postId,
				question: parsed.data.question,
				answer: result.answer,
				status: result.status,
			},
			statusCode,
		);
	} catch (err) {
		if (err instanceof Error && err.message === "NOT_FOUND") {
			return c.json({ error: "Not found" }, 404);
		}
		console.error("ask failed", postId, err);
		const message = err instanceof Error ? err.message : "Ask failed";
		return c.json({ error: message }, 500);
	}
});
