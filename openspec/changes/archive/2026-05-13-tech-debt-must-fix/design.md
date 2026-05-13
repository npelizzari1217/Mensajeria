# Design: Tech Debt Must Fix — Production Readiness

## Technical Approach

Three independent fixes closing implementation gaps. Each follows existing project patterns (repository ports in domain+application, Clean Architecture layers). No migration needed, no external dependencies.

## Architecture Decisions

### Fix 1: Refresh Token DB Storage

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Port location | `domain/` vs `application/auth/ports/` | RefreshToken is infra plumbing, not domain concept | Application port (follows AuthPort pattern) |
| DB on login | sync vs fire-and-forget | Sync adds latency; fire-and-forget risks lost tokens | Sync — token must exist before response |
| Revocation scope | single token vs all user tokens | UX vs security | Single token — `DELETE WHERE userId` for "logout all" later |

**Approach**: `RefreshTokenRepository` port in `api/src/application/auth/ports/`. `PrismaRefreshTokenRepository` in `infrastructure/persistence/prisma/repositories/`. Login: after success, `repo.save(token)`. Refresh: before JWT verify, `repo.findByToken()` — reject if missing. Password change/logout: `repo.deleteByUserId()`.

### Fix 2: Domain Event Bus

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Bus location | `domain/` vs `application/events/` | Domain bus is purer; app bus follows existing port pattern | Application `events/` dir — port in app, impl in infra |
| Dispatch timing | before vs after persist | Before risks event on failed write; after risks missing event on crash | AFTER persist — catch+log handler errors, don't fail the op |
| Handler registration | constructor injection vs `subscribe()` | Injection is explicit; subscribe is flexible | Constructor injection — simple, testable |

**Approach**: `EventBus` port with `dispatch(event)` in `api/src/application/events/`. `InMemoryEventBus` sync impl in `api/src/infrastructure/events/`. Use cases call `eventBus.dispatch()` after successful persistence. No handlers registered yet — bus is wired for future extensibility. Errors in dispatch are caught and logged, never propagated.

### Fix 3: Populate sender/recipient names

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Name storage | enrich domain entity vs separate projection DTO | Projection is cleaner but more files; enrichment is simpler | Enrich domain entity with optional display name fields |
| Recipient names | include in Prisma query vs N+1 in use case | N+1 is simpler but O(n) queries | Include user relation in Prisma query |

**Approach**: Add optional `_senderName` + `_recipientName` fields to domain `Message` and `MessageRecipient` entities (transient — not persisted, not in constructors, only via `.reconstruct()`). `MessageMapper.toDomain()` populates from existing Prisma includes (sender already included, recipient user needs adding). Use cases read via getters instead of hardcoded `''`.

## Data Flow

### Fix 1 — Refresh Token Lifecycle

```
Login Use Case              RefreshTokenRepo         DB
     │                           │                    │
     ├─ verify password ────────►│                    │
     ├─ sign tokens ────────────►│                    │
     ├─ repo.save(token) ───────►├──── INSERT ───────►│
     │◄──────── ok ──────────────┤◄──── ok ───────────┤
     ▼                           │                    │

Refresh Use Case
     │                           │                    │
     ├─ repo.findByToken(t) ────►├──── SELECT ───────►│
     │◄──── token row ───────────┤◄──── row ──────────┤
     ├─ authPort.verify(t) ─────►│                    │
     ├─ sign new access ────────►│                    │
     ▼                           │                    │
```

### Fix 3 — Message Query with Names

```
Use Case                PrismaMessageRepo           DB
   │                          │                     │
   ├─ findByRecipient() ──────►├─ SELECT + JOIN ───►│
   │◄── Message[] (w/ names) ──┤◄── rows ──────────┤
   ├─ map to DTO ─────────────►│                     │
   │   senderName: msg.getName()                    │
   │   recipientName: r.getName()                   │
   ▼                                                │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/src/application/auth/ports/refresh-token.repository.ts` | Create | Port — `save`, `findByToken`, `deleteByUserId` |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-refresh-token.repository.ts` | Create | Prisma impl of RefreshTokenRepository |
| `api/src/application/auth/use-cases/login.use-case.ts` | Modify | Inject `RefreshTokenRepository`, save token after success |
| `api/src/application/auth/use-cases/refresh-token.use-case.ts` | Modify | Inject `RefreshTokenRepository`, validate token in DB |
| `api/src/presentation/auth/auth.module.ts` | Modify | Register new provider + repository |
| `api/src/application/events/event-bus.ts` | Create | EventBus port interface |
| `api/src/infrastructure/events/in-memory-event-bus.ts` | Create | Sync in-process pub/sub impl |
| `api/src/application/auth/use-cases/register-user.use-case.ts` | Modify | Inject EventBus, dispatch after persist |
| `api/src/application/messaging/use-cases/send-message.use-case.ts` | Modify | Inject EventBus, dispatch after persist |
| `api/src/application/messaging/use-cases/mark-as-read.use-case.ts` | Modify | Inject EventBus, dispatch after persist |
| `packages/domain/src/messaging/entities/message.ts` | Modify | Add optional `senderName` getter (transient) |
| `packages/domain/src/messaging/entities/message-recipient.ts` | Modify | Add optional `recipientName` getter (transient) |
| `api/src/infrastructure/persistence/prisma/mappers/message-mapper.ts` | Modify | Populate senderName/recipientName from Prisma includes |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-message.repository.ts` | Modify | Add `recipients: { include: { user: true } }` to includes |
| `api/src/application/messaging/use-cases/get-inbox.use-case.ts` | Modify | Use `msg.getSenderName()`, `r.getRecipientName()` |
| `api/src/application/messaging/use-cases/get-sent.use-case.ts` | Modify | Same |
| `api/src/application/messaging/use-cases/send-message.use-case.ts` | Modify | Populate `recipientName` via user lookup in toResponse |
| `packages/domain/src/index.ts` | Modify | Export new entity getters if added |

## Interfaces / Contracts

### RefreshTokenRepository Port

```typescript
// api/src/application/auth/ports/refresh-token.repository.ts
export interface RefreshTokenRepository {
  save(token: { id: string; token: string; userId: string; expiresAt: Date }): Promise<void>;
  findByToken(token: string): Promise<{ id: string; userId: string; expiresAt: Date } | null>;
  deleteByUserId(userId: string): Promise<void>;
}
```

### EventBus Port

```typescript
// api/src/application/events/event-bus.ts
import { DomainEvent } from '@mensajeria/domain';

export interface EventBus {
  dispatch(event: DomainEvent): void;
  subscribe<T extends DomainEvent>(eventName: string, handler: (event: T) => void): void;
}
```

### Message Entity (new getters)

```typescript
// Transient fields on Message
export class Message {
  // ... existing fields
  private _senderName?: string;

  getSenderName(): string | undefined { return this._senderName; }

  // reconstruct now accepts senderName
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — Login | Saves refresh token on success | Mock RefreshTokenRepo, verify save() called |
| Unit — Refresh | Validates token in DB; rejects if missing | Mock RefreshTokenRepo.findByToken returns null/row |
| Unit — EventBus dispatch | All 3 use cases call dispatch after persist | Mock EventBus, verify dispatch() called once |
| Unit — Inbox/Sent | senderName/recipientName populated | Reconstruct Message with senderName, verify DTO |
| Unit — InMemoryEventBus | Sync dispatch and subscribe | Unit test bus in isolation with mock handler |
| E2E — Auth flow | Login + refresh + password change revocation | Prisma test container or real DB |
| E2E — Message flow | Send → inbox shows senderName | Full create + query |

## Migration / Rollout

No migration needed — `RefreshToken` model already exists in Prisma schema. No data migration required. Existing tokens issued before the fix won't be in DB and will fail on refresh (auto-heal: user re-logs in).

## Dependencies Between Fixes

All three fixes are **fully independent** — no shared files, no shared interfaces, no ordering constraints.
- Fix 1 and Fix 3 touch different repos (RefreshToken vs Message)
- Fix 2 touches different use cases than Fix 1, and same use cases as Fix 3 but different concerns (events vs response shape)
- Can be implemented and tested in any order, or in parallel

## Rollback Per Fix

1. **Fix 1**: revert login/refresh use cases, remove RefreshTokenRepo from module, delete port & impl files
2. **Fix 2**: revert use case changes (remove eventBus.dispatch()), remove EventBus from modules, delete port & impl
3. **Fix 3**: revert mapper/entity changes, restore `''` in use cases, remove Prisma include changes
