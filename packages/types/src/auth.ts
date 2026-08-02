import { z } from "zod";

export const registerSchema = z.object({
	email: z.email(),
	username: z
		.string()
		.min(3)
		.max(32)
		.regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"),
	password: z.string().min(8).max(128),
	name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
	/** Email or username */
	identifier: z.string().min(1),
	password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
