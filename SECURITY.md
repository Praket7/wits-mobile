# Security Policy

## Scope

This repository is a **prototype containing only synthetic data**:

- No production student data (records, names, grades, attendance, messages)
- No credentials, API keys, or tokens of any kind
- No scraping of WITS or any district system
- No secrets in git history; `.env*` files are gitignored (only
  `.env.example` is committed)

## Reporting a vulnerability

Use GitHub's **Security → Report a vulnerability** (private advisory) on this
repository. Please do not open public issues for security reports.

## Production posture (requires WCSD review)

Before any real data flows, the following must be in place and are tracked in
[docs/wcsd-integration.md](docs/wcsd-integration.md):

1. Backend object-level authorization (a parent may only read their linked
   students; a teacher only their sections) — IDs from the phone are never
   trusted.
2. OAuth/OIDC + PKCE through the system browser; tokens in SecureStore only.
3. Backend input validation independent of client-side Zod.
4. Rate limiting, audit logging for sensitive actions, and encrypted transport.
5. A privacy/security review signed off by WCSD.
