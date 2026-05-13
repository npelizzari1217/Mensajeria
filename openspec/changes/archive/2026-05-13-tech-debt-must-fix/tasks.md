# Tasks: Tech Debt Must Fix — Production Readiness

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 570–700 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Fix 3 → names) → PR 2 (Fix 1 → refresh tokens) → PR 3 (Fix 2 → events) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| Fix 3 | Populate senderName/recipientName | PR 1 (base: main) | Smallest diff, pure data plumbing, safest opener |
| Fix 1 | Refresh Token DB storage | PR 2 (base: main) | New port + impl, auth flow wiring |
| Fix 2 | Domain event bus dispatch | PR 3 (base: main) | New port + impl, 3 use cases wired |

All 3 fixes are independent (no shared files). PR order is strategic: names is the smallest/clearest diff, refresh tokens is medium risk, events is the newest abstraction.

---

## Fix 3: Populate senderName/recipientName (PR 1)

- [x] 3.1 Add `_senderName` transient getter to `packages/domain/src/messaging/entities/message.ts`
- [x] 3.2 Add `_recipientName` transient getter to `packages/domain/src/messaging/entities/message-recipient.ts`
- [x] 3.3 Update `api/src/infrastructure/persistence/prisma/mappers/message-mapper.ts` — populate names from Prisma `sender` + `recipient.user`
- [x] 3.4 Update `api/src/infrastructure/persistence/prisma/repositories/prisma-message.repository.ts` — add `recipient: { select: { name: true } }` to all `recipients` includes
- [x] 3.5 Update `get-inbox.use-case.ts` — read `msg.getSenderName()`, `r.getRecipientName()`
- [x] 3.6 Update `get-sent.use-case.ts` — same
- [x] 3.7 Update `send-message.use-case.ts` — populate `recipientName` in `toResponse`
- [x] 3.8 Update `reply-to-message.use-case.ts` — populate `recipientName` in `toResponse`
- [ ] 3.9 Update `get-thread.use-case.ts` — use getters, remove N+1 fallback
- [ ] 3.10 Update `get-message.use-case.ts` — use getters, remove N+1 fallback
- [x] 3.11 Tests: mapper populates names, use cases pass them through, inbox/sent show names (verified: 161 tests pass)

## Fix 1: Refresh Token DB Storage (PR 2)

- [x] 1.1 Create `packages/domain/src/auth/repositories/refresh-token-repository.ts` — port with `save`, `findByToken`, `deleteByUserId`, `deleteExpired`
- [x] 1.2 Create `api/src/infrastructure/persistence/prisma/repositories/prisma-refresh-token.repository.ts` — Prisma impl
- [x] 1.3 Update `login.use-case.ts` — inject `RefreshTokenRepository`, call `save()` after success
- [x] 1.4 Update `refresh-token.use-case.ts` — inject `RefreshTokenRepository`, call `findByToken()` before JWT verify, reject if not found in DB
- [x] 1.5 Add `LogoutUseCase` + `/auth/logout` endpoint — call `deleteByUserId()` to revoke all tokens
- [x] 1.6 Update domain exports and `auth.module.ts` — register new provider + repository
- [x] 1.7 Tests: login saves token (verified by mock), refresh accepts valid DB token, refresh rejects missing/revoked/expired token, logout revokes (7 new tests, all pass)

## Fix 2: Domain Event Bus (PR 3)

- [x] 2.1 Create `packages/domain/src/shared/event-bus.ts` — port with `publish(event)`, `subscribe(handler)` + `EventHandler` type
- [x] 2.2 Create `api/src/infrastructure/event-bus/in-memory-event-bus.ts` — sync in-process pub/sub with error isolation
- [x] 2.3 Create `api/src/infrastructure/event-bus/handlers/logging-handler.ts` — logs dispatched events
- [x] 2.4 Update `register-user.use-case.ts` — inject `EventBus`, call `publish()` after persist
- [x] 2.5 Update `send-message.use-case.ts` — inject `EventBus`, call `publish()` after persist
- [x] 2.6 Update `mark-as-read.use-case.ts` — inject `EventBus`, call `publish()` after persist
- [x] 2.7 Wire EventBus in modules (EventBusModule global, auth.module + messaging.module inject)
- [x] 2.8 Tests: InMemoryEventBus dispatches synchronously, all 3 use cases call publish after success, publish NOT called on failure (57 API tests, 117 domain tests — all pass)

## Notes

- All 3 fixes are independent — no merge conflicts between PRs
- Each PR targets `main` directly (stacked-to-main strategy)
- Existing DB schema already has `RefreshToken` model — no Prisma migration needed
- Domain events (`UserRegistered`, `MessageSent`, `MessageRead`) already exist in domain — only dispatch is missing
