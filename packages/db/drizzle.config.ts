import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

const rootDir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(rootDir, ".env");

if (existsSync(envPath)) {
	loadEnv({ path: envPath });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error(
		"DATABASE_URL is missing. Create packages/db/.env (see .env.example) before running db:migrate.",
	);
}

export default defineConfig({
	schema: "./src/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: databaseUrl,
	},
});
