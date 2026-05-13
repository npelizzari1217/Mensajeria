# Proposal: Tech Debt Must Fix — Production Readiness

## Intent

Fix 3 critical tech debt items blocking production: refresh tokens can't be revoked (JWT-only validation), domain events instantiated but never dispatched (no side-effect extensibility), and inbox/sent/detail responses return empty sender/recipient names.

## Scope

### In Scope
- Store refresh tokens in DB on login; validate against DB on refresh — enable revocation
- Wire existing domain events to an event bus — dispatched after registration, message send, mark-as-read
- Populate `senderName`/`recipientName` from DB in inbox, sent, and detail responses

### Out of Scope
- Event bus provider selection — in-memory only, swappable later via port
- Refresh token rotation / family detection
- Infrastructure/presentation tests (deferred per archive report)
- Web UI changes for recipients display

## Capabilities

### New Capabilities
None — all fixes close implementation gaps. No new user-facing specs needed.

### Modified Capabilities
None — existing `user-auth` and `messaging-core` specs already describe the correct behavior (refresh token stored in DB, sender info in responses). Implementation must catch up.

## Approach

### Fix 1: Refresh Token DB Storage
- **Login use case**: after successful auth, create `RefreshToken` record in DB (Prisma model already exists)
- **Refresh use case**: query DB for token record before JWT verification — reject with 401 if missing or expired
- **Port**: `RefreshTokenRepository` in `application/auth/ports/`
- **Infra**: `PrismaRefreshTokenRepository` implementing the port
- **No migration needed** — schema already has `model RefreshToken { id, token, userId, expiresAt, createdAt }`

### Fix 2: Domain Event Bus
- **Port**: `EventBus` with `dispatch(event)` in `application/events/`
- **Infra**: `InMemoryEventBus` — synchronous, job-queue pattern for future
- **Wiring**: call `eventBus.dispatch(new UserRegistered(...))` in `RegisterUserUseCase`, `SendMessageUseCase`, `MarkAsReadUseCase` after successful write

### Fix 3: Populate sender/recipient names
- **PrismaMessageRepository**: add `include: { sender: true, recipients: { include: { user: true } } }` to relevant queries
- **MessageMapper**: map `sender.name` and `recipient.user.name` to DTO fields
- **No use-case changes needed** — DTOs already have the shape, mappers just fill values

### Dependencies Between Fixes
- **Fix 1** and **Fix 3** are independent — parallel work
- **Fix 2** is independent of both — parallel work

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/src/application/auth/ports/refresh-token.repository.ts` | New | Repository port |
| `api/src/application/auth/use-cases/login.use-case.ts` | Modified | Save refresh token on login |
| `api/src/application/auth/use-cases/refresh-token.use-case.ts` | Modified | Validate against DB |
| `api/src/application/events/event-bus.ts` | New | EventBus port |
| `api/src/infrastructure/events/in-memory-event-bus.ts` | New | Sync in-memory bus |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-refresh-token.repository.ts` | New | Prisma implementation |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-message.repository.ts` | Modified | Include relations |
| `packages/domain/` (use cases instantiating events) | Modified | Wire eventBus.dispatch() |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing refresh tokens (issued before fix) won't be in DB → force re-login | Medium | Ship fix, existing tokens expire per TTL anyway |
| Event bus dispatch failure blocks the operation | Low | Dispatch AFTER success, not before; log + swallow in v1 |
| Adding JOINs to message queries degrades performance | Low | Indexes exist, message count is small at this stage |

## Rollback Plan

Per-fix revert — no cross-cutting changes between fixes:
1. **Fix 1**: revert to JWT-only verification; stop saving tokens on login
2. **Fix 2**: remove `eventBus.dispatch()` calls from use cases
3. **Fix 3**: revert `include` in Prisma queries, restore empty-string defaults

## Dependencies

None. All changes self-contained within the existing codebase. No external services, no migration generation needed.

## Success Criteria

- [ ] Login creates a `RefreshToken` record in the database
- [ ] Refresh with missing/expired DB record → 401; with valid DB record → 200
- [ ] `UserRegistered` event dispatched after registration
- [ ] `MessageSent` event dispatched after sending a message
- [ ] `MessageRead` event dispatched after marking as read
- [ ] Inbox response includes `senderName` (not empty string)
- [ ] Sent response includes `recipientName` (not empty string)
- [ ] Message detail response includes both `senderName` and `recipientName`
