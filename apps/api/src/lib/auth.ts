import { createDb } from "@rag-blog/db";
import * as schema from "@rag-blog/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { getDbUrl } from "../env";
import { hashPassword, verifyPassword } from "./password";

export function createAuth(env: Env) {
	const db = createDb(getDbUrl(env));

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		secret: env.BETTER_AUTH_SECRET,
		// Public origin the browser uses (web app). `/api/*` is proxied same-origin so cookies stick.
		baseURL: env.APP_URL,
		basePath: "/api/auth",
		trustedOrigins: [env.WEB_ORIGIN, env.APP_URL],
		emailAndPassword: {
			enabled: true,
			password: {
				hash: hashPassword,
				verify: verifyPassword,
			},
		},
		advanced: {
			defaultCookieAttributes: {
				sameSite: "lax",
				path: "/",
				secure: env.APP_URL.startsWith("https://"),
			},
		},
		plugins: [
			username({
				minUsernameLength: 3,
				maxUsernameLength: 32,
			}),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
