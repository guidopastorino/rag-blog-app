import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

describe("password hasher", () => {
	it("hashes and verifies with Web Crypto PBKDF2", async () => {
		const hash = await hashPassword("correct-horse-battery");
		expect(hash.startsWith("pbkdf2_sha256$")).toBe(true);
		await expect(verifyPassword({ hash, password: "correct-horse-battery" })).resolves.toBe(true);
		await expect(verifyPassword({ hash, password: "wrong" })).resolves.toBe(false);
	});
});
