import { createDb, type Database } from "@rag-blog/db";
import { getDbUrl } from "../env";

export function dbFromEnv(env: Env): Database {
	return createDb(getDbUrl(env));
}
