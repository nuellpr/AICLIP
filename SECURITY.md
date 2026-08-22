# Security Policy

## Reporting a Vulnerability

If you discover a security issue in AICLIP (ClipForge AI), please report it privately to the maintainer at **nuel@clipforge.ai** (or the email listed in the commit history). Do not create a public GitHub issue.

We aim to respond within 48 hours and release a fix within 7 days of confirmation.

## Scope

- API endpoints (`apps/api/src/`)
- Authentication & authorization (JWT, Google OAuth)
- Payment processing (Midtrans)
- File upload & storage
- User data handling

## Out of Scope

- Dependency vulnerabilities (tracked via `pnpm audit`)
- Issues in legacy directories (`backend/`, `frontend/`, `shared/` — scheduled for removal)
- Third-party API keys (rotate keys, do not commit them)

## Authentication

- All `/api/*` routes require JWT authentication (except `/api/auth/*`, `/health`, `/ready`, Midtrans webhook)
- Admin routes (`/api/admin/*`) require JWT + ADMIN role
- JWT secret must be set via `AUTH_SECRET` environment variable; app refuses to start in production without it
- Google OAuth falls back to insecure JWT decode only when `NODE_ENV != production` AND `ALLOW_INSECURE_GOOGLE_AUTH=true`

## Data Protection

- API keys stored in `ai-config.json` (gitignored) are masked in API responses
- Database (`*.db` files) is gitignored
- User passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ yes    |
| older   | ❌ no     |