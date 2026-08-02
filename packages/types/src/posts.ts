import { z } from "zod";

export const createPostSchema = z.object({
	title: z.string().min(1).max(200),
	body: z.string().min(1).max(100_000),
	imageKey: z.string().min(1).optional(),
});

export const updatePostSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	body: z.string().min(1).max(100_000).optional(),
	imageKey: z.string().min(1).nullable().optional(),
});

export const postIdParamSchema = z.object({
	id: z.string().min(1),
});

export const postSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	authorId: z.string(),
	authorUsername: z.string().optional(),
	imageKey: z.string().nullable(),
	imageUrl: z.string().nullable().optional(),
	ragIndexStatus: z.enum(["pending", "ready", "failed"]),
	createdAt: z.string(),
	updatedAt: z.string(),
	likeCount: z.number().int().nonnegative().optional(),
	commentCount: z.number().int().nonnegative().optional(),
	shareCount: z.number().int().nonnegative().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type Post = z.infer<typeof postSchema>;
