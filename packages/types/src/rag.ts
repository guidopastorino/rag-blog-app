import { z } from "zod";

export const askPostQuestionSchema = z.object({
	question: z.string().trim().min(1).max(2_000),
});

export const askPostAnswerSchema = z.object({
	postId: z.string(),
	question: z.string(),
	answer: z.string(),
	status: z.enum(["ok", "not_ready", "no_content"]),
});

export type AskPostQuestionInput = z.infer<typeof askPostQuestionSchema>;
export type AskPostAnswer = z.infer<typeof askPostAnswerSchema>;
