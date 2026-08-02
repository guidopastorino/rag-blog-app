import { createMiddleware } from "hono/factory";
import type { Auth } from "../lib/auth";

export type SessionUser = {
	id: string;
	email: string;
	name: string;
	username?: string | null;
};

export type AppVariables = {
	auth: Auth;
	user: SessionUser | null;
	session: { id: string; userId: string } | null;
};

export const sessionMiddleware = createMiddleware<{
	Bindings: Env;
	Variables: AppVariables;
}>(async (c, next) => {
	const auth = c.get("auth");
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (session) {
		c.set("user", {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name,
			username: "username" in session.user ? (session.user.username as string | null) : null,
		});
		c.set("session", { id: session.session.id, userId: session.user.id });
	} else {
		c.set("user", null);
		c.set("session", null);
	}
	await next();
});

export const requireAuth = createMiddleware<{
	Bindings: Env;
	Variables: AppVariables;
}>(async (c, next) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});
