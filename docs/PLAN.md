# riannah's plants — Implementation Plan

## Confirmed decisions

- Login identifier: email only
- Roles: admin, user
- Public signup: disabled (closed beta)
- Password reset: deferred from v1
- Password policy: min 12 chars

## Delivery phases

1. Foundation
   - repo bootstrap
   - Cloudflare env setup (dev/prod)
   - CI baseline
2. Auth + RBAC
   - login/logout
   - admin create-user flow
   - route protection
3. Plants + scheduling
   - CRUD plants
   - watering + repotting schedules
   - due/upcoming dashboard
4. Event tracking + hardening
   - watering/repotting event logs
   - history views
   - validation and permission hardening


## UI theme direction

Design language should be nature-inspired and calm:
- primary palette: olive / greens
- supporting neutrals: tan / brown / muted earthy red
- overall feel: simple, grounded, low-contrast where possible, accessible readability
