# Noor Canvas – Engineering Standards
**How Copilot should use this file**
- Treat this as the source for coding style, CI/CD, testing and security rules.
- When asked about “how to implement/test/commit/secure”, cite sections here.
- Prefer these standards over ad-hoc suggestions; if a conflict arises, ask before deviating.

**Contents to keep current**
- Formatting (.editorconfig norms), nullable, warnings-as-errors policy
- Pre-commit steps (build/format/tracker validation)
- CI matrix (quick verify vs full), caching, Playwright reports
- API/DTO rules, versioning, error envelope
- EF Core usage: migrations, AsNoTracking, projections, indexing
- Async + DI lifetimes, observability (Serilog + correlation), security headers/secrets
- Blazor ergonomics, Playwright tagging, Conventional Commits + PR template
