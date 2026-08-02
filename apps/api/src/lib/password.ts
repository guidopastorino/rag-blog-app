/**
 * Workers-safe password hashing via Web Crypto PBKDF2.
 * Avoids native bcrypt bindings that crash or OOM on Cloudflare Workers.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function toHex(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function fromHex(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
	const enc = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
		"deriveBits",
	]);
	return crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_LENGTH * 8,
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const derived = await deriveKey(password, salt);
	return `pbkdf2_sha256$${ITERATIONS}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(data: { hash: string; password: string }): Promise<boolean> {
	const [algo, iterStr, saltHex, hashHex] = data.hash.split("$");
	if (algo !== "pbkdf2_sha256" || !iterStr || !saltHex || !hashHex) {
		return false;
	}
	const salt = fromHex(saltHex);
	const expected = fromHex(hashHex);
	const derived = new Uint8Array(await deriveKey(data.password, salt));
	if (derived.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < derived.length; i++) {
		diff |= (derived[i] ?? 0) ^ (expected[i] ?? 0);
	}
	return diff === 0;
}
