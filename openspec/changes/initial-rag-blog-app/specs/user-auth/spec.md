## Purpose

Permite a los usuarios registrarse e iniciar sesión con email o username y password, mantener sesión autenticada y proteger acciones que requieren identidad.

## ADDED Requirements

### Requirement: User registration with email or username
The system MUST allow a new user to register with a unique email, a unique username, and a password.

#### Scenario: Successful registration
- **WHEN** a visitor submits a valid unused email, unused username, and password meeting policy
- **THEN** the system creates the account and returns an authenticated session

#### Scenario: Duplicate identity rejected
- **WHEN** a visitor attempts to register with an email or username that already exists
- **THEN** the system MUST reject the registration with a clear validation error and MUST NOT create a duplicate account

### Requirement: Login with email or username and password
The system MUST authenticate users using either email or username together with their password.

#### Scenario: Login with email
- **WHEN** a registered user submits a correct email and password
- **THEN** the system establishes an authenticated session

#### Scenario: Login with username
- **WHEN** a registered user submits a correct username and password
- **THEN** the system establishes an authenticated session

#### Scenario: Invalid credentials
- **WHEN** a user submits an unknown identity or incorrect password
- **THEN** the system MUST deny access without revealing which field was wrong

### Requirement: Session-protected actions
The system MUST require a valid authenticated session for actions that mutate user-owned resources (create/edit/delete posts, engage, and ask RAG questions when auth is required).

#### Scenario: Unauthenticated mutation rejected
- **WHEN** an unauthenticated client attempts a protected mutation
- **THEN** the system MUST respond with an authentication error and MUST NOT apply the mutation

#### Scenario: Authenticated user can access protected mutation
- **WHEN** an authenticated user with a valid session calls a protected mutation they are authorized for
- **THEN** the system MUST accept the request for further authorization/business checks

### Requirement: Logout ends session
The system MUST allow an authenticated user to log out and invalidate the current session.

#### Scenario: Logout clears session
- **WHEN** an authenticated user logs out
- **THEN** subsequent requests using that session MUST be treated as unauthenticated

### Requirement: Password hashing compatible with Workers
The system MUST hash and verify passwords with a lightweight hashing approach compatible with the Cloudflare Workers runtime so auth requests do not crash the Worker.

#### Scenario: Password verify on Workers
- **WHEN** a user registers or logs in on the API Worker
- **THEN** password hashing and verification MUST complete successfully without runtime crashes due to unsupported crypto APIs
