import { describe, expect, it } from "vitest";
import { chunkText } from "../src/lib/chunk";

describe("chunkText", () => {
	it("returns empty for blank input", () => {
		expect(chunkText("")).toEqual([]);
		expect(chunkText("   ")).toEqual([]);
	});

	it("keeps short text as one chunk", () => {
		expect(chunkText("Hello world")).toEqual(["Hello world"]);
	});

	it("splits long paragraphs", () => {
		const long = "a".repeat(1800);
		const chunks = chunkText(long, 800);
		expect(chunks.length).toBeGreaterThan(1);
		expect(chunks.join("")).toBe(long);
	});
});
