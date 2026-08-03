import type { NextConfig } from "next";

const apiBackend =
	process.env.API_BACKEND_URL ?? "https://rag-blog-api.guidopasto05.workers.dev";

const nextConfig: NextConfig = {
	transpilePackages: ["@rag-blog/types"],
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: `${apiBackend.replace(/\/$/, "")}/api/:path*`,
			},
		];
	},
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
