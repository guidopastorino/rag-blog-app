import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Uses same origin; `/api/auth/*` is proxied to the API Worker. */
export const authClient = createAuthClient({
	plugins: [usernameClient()],
});
