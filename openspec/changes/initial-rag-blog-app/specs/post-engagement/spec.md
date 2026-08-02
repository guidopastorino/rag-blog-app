## Purpose

Permite a usuarios interactuar con posts mediante likes, shares y comentarios, y consultar ese engagement de forma consistente.

## ADDED Requirements

### Requirement: Like a post
The system MUST allow an authenticated user to like a post and MUST prevent duplicate likes from the same user on the same post.

#### Scenario: First like succeeds
- **WHEN** an authenticated user likes a post they have not liked
- **THEN** the system records the like and the post like count increases by one

#### Scenario: Duplicate like rejected or idempotent
- **WHEN** an authenticated user attempts to like a post they already liked
- **THEN** the system MUST NOT create a second like for that user-post pair

### Requirement: Unlike a post
The system MUST allow an authenticated user to remove their like from a post.

#### Scenario: Unlike succeeds
- **WHEN** an authenticated user who previously liked a post removes the like
- **THEN** the like is removed and the post like count decreases by one

### Requirement: Share a post
The system MUST allow a client to record a share action for a post and expose a shareable post reference (e.g. canonical URL or identifier).

#### Scenario: Share recorded
- **WHEN** a client shares a post
- **THEN** the system records a share event and returns a shareable reference for that post

### Requirement: Comment on a post
The system MUST allow an authenticated user to create a text comment on a post and MUST allow clients to list comments for a post.

#### Scenario: Create comment
- **WHEN** an authenticated user submits a non-empty comment on an existing post
- **THEN** the system stores the comment attributed to that user and associates it with the post

#### Scenario: List comments
- **WHEN** a client requests comments for a post
- **THEN** the system returns the comments in a deterministic order with author and timestamp

#### Scenario: Empty comment rejected
- **WHEN** a user submits an empty or whitespace-only comment
- **THEN** the system MUST reject the comment with a validation error

### Requirement: Engagement requires existing post
The system MUST reject likes, shares, and comments that target a non-existent post.

#### Scenario: Engagement on missing post
- **WHEN** a client attempts to like, share, or comment on an unknown post identifier
- **THEN** the system MUST return a not-found error and MUST NOT create engagement records
