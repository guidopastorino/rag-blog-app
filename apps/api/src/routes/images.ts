import { Hono } from "hono";
import { newId } from "../lib/ids";
import { createR2S3Client } from "../lib/r2";
import type { AppVariables } from "../middleware/session";
import { requireAuth } from "../middleware/session";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export const imagesRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

imagesRoutes.post("/upload", requireAuth, async (c) => {
	const s3 = createR2S3Client(c.env);
	if (!s3 && !c.env.BLOG_IMAGES) {
		return c.json({ error: "Image uploads are disabled (R2 not configured)" }, 503);
	}

	const form = await c.req.parseBody();
	const file = form.file;
	if (!file || typeof file === "string") {
		return c.json({ error: "file is required" }, 400);
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return c.json({ error: "Unsupported image type" }, 400);
	}

	const ext = file.type.split("/")[1] ?? "bin";
	const key = `posts/${newId()}.${ext}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	if (s3) {
		await s3.putObject(key, bytes, file.type);
	} else if (c.env.BLOG_IMAGES) {
		await c.env.BLOG_IMAGES.put(key, bytes, {
			httpMetadata: { contentType: file.type },
		});
	}

	const url = c.env.R2_PUBLIC_BASE_URL ? `${c.env.R2_PUBLIC_BASE_URL}/${key}` : null;
	return c.json({ key, url }, 201);
});
