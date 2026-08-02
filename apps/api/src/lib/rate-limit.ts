/** Soft KV rate limiter (eventually consistent — acceptable for v1). */
export async function checkRateLimit(
	kv: KVNamespace,
	key: string,
	limit: number,
	windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
	const raw = await kv.get(key);
	const count = raw ? Number.parseInt(raw, 10) : 0;
	if (Number.isNaN(count)) {
		await kv.put(key, "1", { expirationTtl: windowSeconds });
		return { allowed: true, remaining: limit - 1 };
	}
	if (count >= limit) {
		return { allowed: false, remaining: 0 };
	}
	await kv.put(key, String(count + 1), { expirationTtl: windowSeconds });
	return { allowed: true, remaining: limit - count - 1 };
}
