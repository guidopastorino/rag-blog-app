## Purpose

Permite indexar el contenido de cada post de forma asíncrona y responder preguntas específicas sobre un post usando recuperación aumentada (RAG) con IA.

## ADDED Requirements

### Requirement: Asynchronous post indexing for RAG
The system MUST enqueue asynchronous indexing when a post is created or updated so embeddings are generated without blocking the write response.

#### Scenario: Create/update enqueues indexing
- **WHEN** a post is successfully created or updated
- **THEN** the system enqueues a background job to chunk and embed that post content

#### Scenario: Write response not blocked by embedding
- **WHEN** a client creates or updates a post
- **THEN** the HTTP response for the write MUST return after persistence without waiting for embedding completion

### Requirement: Indexing job produces retrievable embeddings
The system MUST process indexing jobs by chunking post content, generating embeddings, and storing vectors associated with the post for later retrieval.

#### Scenario: Successful indexing
- **WHEN** an indexing job for a post runs successfully
- **THEN** the post MUST have stored embeddings queryable for similarity search scoped to that post

#### Scenario: Re-index replaces stale vectors
- **WHEN** a post is updated and re-indexed
- **THEN** retrieval for that post MUST use embeddings reflecting the updated content (stale chunks MUST NOT remain as the only source)

### Requirement: Ask questions about a specific post
The system MUST accept a natural-language question scoped to a post identifier, retrieve relevant chunks for that post, and return an AI-generated answer grounded in retrieved content.

#### Scenario: Answer grounded in post content
- **WHEN** a client asks a question about an indexed post
- **THEN** the system retrieves relevant chunks for that post only and returns an answer based on those chunks

#### Scenario: Question on missing post
- **WHEN** a client asks a question about a non-existent post identifier
- **THEN** the system MUST return a not-found error

### Requirement: Unindexed or empty retrieval handling
The system MUST handle questions for posts that are not yet indexed or have no relevant chunks without fabricating post-specific facts.

#### Scenario: Post not indexed yet
- **WHEN** a client asks a question about a post whose indexing has not completed
- **THEN** the system MUST indicate that the post is not ready for Q&A (or equivalent unavailable state) instead of inventing an answer from other posts

#### Scenario: No relevant chunks
- **WHEN** retrieval finds no sufficiently relevant chunks for the question within the post
- **THEN** the system MUST respond that it cannot find supporting content in the post rather than answering from unrelated sources

### Requirement: Rate limiting for RAG queries
The system MUST rate-limit RAG question requests to protect AI and database resources.

#### Scenario: Excess RAG requests throttled
- **WHEN** a client exceeds the configured RAG query rate limit
- **THEN** the system MUST reject further questions with a rate-limit error until the window resets
