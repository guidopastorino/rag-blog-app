import { S3mini } from "s3mini";

/** Optional S3-compatible client for R2 when access keys are configured. Prefer the R2 binding for Workers. */
export function createR2S3Client(env: Env) {
	if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
		return null;
	}
	const bucket = env.R2_BUCKET ?? "rag-blog-images";
	return new S3mini({
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucket}`,
		region: "auto",
	});
}
