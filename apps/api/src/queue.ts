import { dbFromEnv } from "./lib/db";
import { indexPost } from "./lib/rag";

export async function handleRagIndexBatch(
	batch: MessageBatch<RagIndexMessage>,
	env: Env,
): Promise<void> {
	const db = dbFromEnv(env);
	for (const message of batch.messages) {
		try {
			await indexPost(env, db, message.body.postId);
			message.ack();
		} catch (err) {
			console.error("RAG index message failed", message.body, err);
			message.retry();
		}
	}
}
