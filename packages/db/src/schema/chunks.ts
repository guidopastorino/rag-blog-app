import { index, integer, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";
import { posts } from "./posts";

/** bge-large-en-v1.5 embedding dimension = 1024 */
export const postChunks = pgTable(
	"post_chunks",
	{
		id: text("id").primaryKey(),
		postId: text("post_id")
			.notNull()
			.references(() => posts.id, { onDelete: "cascade" }),
		chunkIndex: integer("chunk_index").notNull(),
		content: text("content").notNull(),
		embedding: vector("embedding", { dimensions: 1024 }).notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("post_chunks_post_id_idx").on(table.postId)],
);
