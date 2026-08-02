interface Env {
	HYPERDRIVE: Hyperdrive;
	BLOG_IMAGES: R2Bucket;
	RATE_LIMIT: KVNamespace;
	RAG_INDEX_QUEUE: Queue;
	AI: Ai;
	APP_URL: string;
	API_URL: string;
	WEB_ORIGIN: string;
	BETTER_AUTH_SECRET: string;
	/** Optional local DB URL override when Hyperdrive is unavailable */
	DATABASE_URL?: string;
	R2_ACCOUNT_ID?: string;
	R2_ACCESS_KEY_ID?: string;
	R2_SECRET_ACCESS_KEY?: string;
	R2_BUCKET?: string;
	R2_PUBLIC_BASE_URL?: string;
}

interface RagIndexMessage {
	postId: string;
}
