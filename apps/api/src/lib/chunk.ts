/** Simple paragraph/size chunker for post body text. */
export function chunkText(text: string, maxChars = 800): string[] {
	const normalized = text.replace(/\r\n/g, "\n").trim();
	if (!normalized) return [];

	const paragraphs = normalized.split(/\n{2,}/);
	const chunks: string[] = [];
	let current = "";

	for (const para of paragraphs) {
		const piece = para.trim();
		if (!piece) continue;
		if (`${current}\n\n${piece}`.length <= maxChars) {
			current = current ? `${current}\n\n${piece}` : piece;
			continue;
		}
		if (current) chunks.push(current);
		if (piece.length <= maxChars) {
			current = piece;
		} else {
			for (let i = 0; i < piece.length; i += maxChars) {
				chunks.push(piece.slice(i, i + maxChars));
			}
			current = "";
		}
	}
	if (current) chunks.push(current);
	return chunks;
}
