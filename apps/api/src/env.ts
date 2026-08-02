export function getDbUrl(env: Env): string {
	return env.DATABASE_URL ?? env.HYPERDRIVE.connectionString;
}
