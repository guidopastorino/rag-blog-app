import { z } from "zod";

export const createCommentSchema = z.object({
	body: z.string().trim().min(1).max(5_000),
});

export const commentSchema = z.object({
	id: z.string(),
	postId: z.string(),
	authorId: z.string(),
	authorUsername: z.string().optional(),
	body: z.string(),
	createdAt: z.string(),
});

export const shareResponseSchema = z.object({
	postId: z.string(),
	shareUrl: z.string(),
	shareCount: z.number().int().nonnegative(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type Comment = z.infer<typeof commentSchema>;
