import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.toml" },
				miniflare: {
					bindings: {
						BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
						APP_URL: "http://localhost:3000",
						API_URL: "http://localhost:8787",
						WEB_ORIGIN: "http://localhost:3000",
					},
				},
			},
		},
	},
});
