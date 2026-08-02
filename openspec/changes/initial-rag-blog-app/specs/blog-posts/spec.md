## Purpose

Permite a usuarios autenticados crear y gestionar posts/blogs con contenido textual e imágenes asociadas, y a cualquier visitante leer posts publicados.

## ADDED Requirements

### Requirement: Create blog post
The system MUST allow an authenticated user to create a blog post with at least a title and body content.

#### Scenario: Authenticated create succeeds
- **WHEN** an authenticated user submits a valid title and body
- **THEN** the system creates the post owned by that user and returns the post identifier

#### Scenario: Invalid create payload rejected
- **WHEN** a user submits a post missing required fields or with invalid types
- **THEN** the system MUST reject the request with validation errors and MUST NOT create a post

### Requirement: Read published posts
The system MUST allow clients to list published posts and retrieve a single post by identifier.

#### Scenario: List posts
- **WHEN** a client requests the published posts list
- **THEN** the system returns posts with identifiers, titles, authors, and timestamps needed for browsing

#### Scenario: Get post by id
- **WHEN** a client requests a post by a valid identifier
- **THEN** the system returns the full post content for display

#### Scenario: Missing post
- **WHEN** a client requests a post identifier that does not exist
- **THEN** the system MUST return a not-found error

### Requirement: Update and delete own posts
The system MUST allow a post owner to update or delete their own posts and MUST deny those operations to other users.

#### Scenario: Owner updates post
- **WHEN** the post owner submits a valid update
- **THEN** the system persists the changes and returns the updated post

#### Scenario: Non-owner update denied
- **WHEN** an authenticated user who is not the owner attempts to update or delete a post
- **THEN** the system MUST deny the operation with an authorization error

### Requirement: Blog image upload to object storage
The system MUST allow authenticated authors to upload blog images to object storage and associate image references with posts.

#### Scenario: Image upload succeeds
- **WHEN** an authenticated author uploads a supported image for a post
- **THEN** the system stores the object and returns a reference usable by the post

#### Scenario: Unauthenticated upload rejected
- **WHEN** an unauthenticated client attempts to upload a blog image
- **THEN** the system MUST reject the upload
