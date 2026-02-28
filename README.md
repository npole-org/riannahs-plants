# riannahs-garden

Closed-beta household plant management app by npole.

## Product Summary

Users can:
- log in (email/password)
- track their household plants
- set watering schedules and log watering events
- set repotting schedules and log repotting events
- see what's due now/upcoming

## Architecture (v1)

- Frontend: React (Vite)
- Hosting: Cloudflare Pages
- API: Cloudflare Workers
- Data: Cloudflare D1
- Auth: server-issued secure session cookies

## Environments

- `dev` for testing and iteration
- `prod` for stable release

Each environment will have isolated config/secrets/data.

## Security Baseline

- Email-only auth
- Roles: `admin`, `user`
- Closed beta (no public sign-up)
- Password policy: minimum 12 characters
- Password reset: deferred for v1 (manual admin/db handling)

## Docs

- Plan: `docs/PLAN.md`
- ADRs: `docs/adrs/`
