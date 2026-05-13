---
title: "Archive Report: mensajeria-core"
change: mensajeria-core
phase: archive
artifact: archive-report
status: final
archived-at: 2026-05-13
---

# Archive Report: mensajeria-core

## Summary

Greenfield messaging system — first delivery of the Mensajeria platform. Built bottom-up with strict Clean Architecture: Domain → Application → Infrastructure → Presentation → Web. Delivered across 4 stacked-to-main PRs totaling ~4,200+ LOC.

## What Was Implemented

### Domain Layer (`packages/domain/`)
- **7 Value Objects**: UserId, MessageId, Email, Role, Subject, MessageBody, MessageStatus, ThreadId, Password, UserIdentity
- **4 Entities**: User, Message, MessageRecipient, ConversationThread
- **Repository Ports**: UserRepository (save, findById, findByEmail, existsByEmail), MessageRepository (save, saveRecipient, findByRecipient, findBySender, findById, findThread)
- **Domain Events**: UserRegistered, MessageSent, MessageRead
- **Shared Kernel**: Result<T,E> with ok/err/unwrap, DomainError, NotFoundError
- **Zero external dependencies** — pure TypeScript, only typescript + vitest as devDeps

### Application Layer (`api/src/application/`)
- **Auth**: AuthPort (sign/verify), PasswordHasher (hash/compare), 4 use cases (RegisterUser, Login, GetCurrentUser, RefreshToken), 4 DTOs
- **Messaging**: 7 use cases (SendMessage, GetInbox, GetSent, GetMessage, MarkAsRead, ReplyToMessage, GetThread), 4 DTOs
- All use cases return `Result<T, DomainError>` — consistent error handling

### Infrastructure (`api/src/infrastructure/`)
- **Prisma Schema**: 5 models (User, RefreshToken, Message, MessageRecipient, ConversationThread) with enums (Role, MessageStatus) and indexes
- **PrismaService**: singleton with lifecycle hooks
- **EnvConfig**: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS
- **Mappers**: UserMapper + MessageMapper (toDomain/toPrisma pattern)
- **Repositories**: PrismaUserRepository + PrismaMessageRepository (pagination, status filters, thread reconstruction)
- **Auth**: JwtAuthPort, BcryptPasswordHasher, AuthGuard, RolesGuard, CurrentUser/Roles decorators
- **Seed data**: 4 test users + example messages with reply chain

### Presentation — API (`api/src/presentation/`)
- **Shared**: AppExceptionFilter (DomainError → HTTP mapping), ResponseInterceptor ({ data } envelope)
- **AuthModule**: POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/me — all with Zod validation
- **MessagingModule**: 7 endpoints (POST /messages, GET /messages/inbox, GET /messages/sent, GET /messages/:id, PATCH /messages/:id/read, POST /messages/:id/reply, GET /messages/:id/thread)
- Global prefix `/v1`, CORS configured for web dev server

### Web Frontend (`web/`)
- React 19 + Vite + React Router v7 + axios
- AuthContext with in-memory token + transparent refresh via httpOnly cookie
- ProtectedRoute redirect guard
- Layout with sidebar navigation + topbar
- LoginPage (form with validation, error display, loading state)
- InboxPage (tabs: Nuevos/Leidos/Todos, pagination 10/page, unread indicators)
- SentPage (paginated sent messages)
- ComposePage (recipient/subject/body form, redirect to /sent)
- MessageDetailPage (header, body, auto mark-as-read, inline reply, thread display)
- 580 lines of CSS — clean responsive layout

### Tests
- **Domain**: 117/117 passing (5 test files: VOs, Result, User, Message, MessageRecipient)
- **API**: 44 tests across 8 files (auth: register, login, auth-flow; messaging: send, inbox, mark-read, reply; E2E: messaging-flow)
- **Coverage**: Domain entities + VOs + Result fully covered. Application use cases covered with mocks.

### 4 PRs Stacked-to-Main

| PR | Branch | Tasks | Focus | LOC |
|----|--------|-------|-------|-----|
| #1 | `sdd/mensajeria-core/domain` | T-001, T-002, T-003, T-018 | Domain standalone | ~630 |
| #2 | `sdd/mensajeria-core/auth-api` | T-004, T-005, T-007, T-008, T-009, T-012, T-013, T-019(auth) | Auth API | ~810 |
| #3 | `sdd/mensajeria-core/messaging-api` | T-006, T-010, T-011, T-014, T-019(msg), T-020 | Messaging API | ~820 |
| #4 | `sdd/mensajeria-core/web` | T-015, T-016, T-017 | Web Frontend | ~1,240 + 580 CSS |

## Technical Decisions Made During Implementation

### Architecture
1. **Clean Architecture with strict dependency rule**: Domain → Application → Infrastructure → Presentation. Domain has zero external deps. Application depends only on domain. Infrastructure implements domain/application ports. Presentation depends only on application.

2. **Two NestJS modules (AuthModule + MessagingModule)**: Separate DI scopes. No global module for repositories — each module imports what it needs.

3. **Repository ports in domain layer**: `UserRepository` and `MessageRepository` interfaces live in `domain/`. Infrastructure implements them. Keeps domain pure.

4. **AuthPort/PasswordHasher as application ports**: Interfaces in `application/auth/ports/`. Implementations in `infrastructure/auth/` (JwtAuthPort, BcryptPasswordHasher). Clean adapter pattern.

5. **Mapper pattern (toDomain/toPrisma)**: Stateless mappers decouple Prisma models from domain entities. `toDomain` uses `reconstruct()` (skips validation for trusted DB data). `toPrisma` extracts `.get()` from each VO.

6. **Result<T,E> throughout**: Every use case returns `Result<T, DomainError>`. ExceptionFilter maps domain errors to HTTP codes (NotFound→404, NotAuthorized→403, Validation→400, Conflict→409).

7. **Response envelope**: All successful responses wrapped in `{ data: ... }` or `{ data[], total, page, pageSize }`.

### Auth
8. **JWT with httpOnly cookies**: Access token in Authorization header, refresh token in httpOnly/secure/sameSite=strict cookie (in-memory on frontend, cookie on API). Prevents XSS token theft.

9. **RBAC with role hierarchy**: `RoleVO.isAtLeast()` for hierarchy checks. `RolesGuard` enforces minimum role level.

10. **Same 401 for wrong email/password**: `InvalidCredentialsError` with identical message — prevents email enumeration.

### Web
11. **In-memory token storage** (not localStorage): Aligns with httpOnly cookie strategy for refresh. Token lives only in JS memory, lost on page reload (session restored via refresh cookie).

12. **Axios interceptor with request queue**: On 401, queues concurrent requests while refreshing the token, then replays them — prevents race conditions during refresh.

13. **Plain CSS** (not Tailwind/CSS modules): MVP simplicity. 580 lines for the full app.

### PR Strategy
14. **Stacked-to-main with 4 PRs**: Domain standalone → Auth API (depends on domain) → Messaging API (depends on auth infra) → Web (depends on API). Each PR independently merges to main once reviewed.

## Out of Scope (Deferred to Future Changes)

| Feature | Target Delivery | Notes |
|---------|----------------|-------|
| WebSockets / Real-time | Entrega 3 | Requires Socket.IO or SSE infrastructure |
| File Attachments | Entrega 2 | FileStorage port + S3/local adapter |
| Multiple Recipients | Entrega 2 | Already partially supported by schema (MessageRecipient) |
| Conversation Threads / Replies | Entrega 3 | Schema supports it, use cases exist, but full thread UX deferred |
| Mobile (Expo) | Entrega 4 | Full cross-platform UI |
| Offline / SyncEngine | Entrega 4 | Service Worker + IndexedDB |
| Push Notifications | Entrega 4 | FCM/APNs integration |
| Full-text Search | Entrega 3 | PostgreSQL tsvector or Meilisearch |
| OAuth / SSO | Future | Enterprise auth integration |
| 2FA | Future | TOTP or SMS-based |
| Password Recovery | Future | Email-based reset flow |
| User Management UI | Future | Admin panel for user CRUD |
| Registration Page (Web) | Future | Currently only API-based registration |

## Technical Debt Identified

### Must Fix Before Production
1. **Refresh token not stored in DB** — `refresh-token.use-case.ts` verifies JWT signature only. No DB storage for refresh tokens means no revocation support. Tokens can't be invalidated server-side.
2. **Domain events created but never dispatched** — `void event` pattern in use cases. Events are instantiated but no event bus dispatches them. No side-effect extensibility.
3. **Inbox/sent responses have empty senderName/recipientName** — Use cases hardcode `''`. Needs JOIN queries or batch user loading.

### Should Fix Soon
4. **No infrastructure/presentation tests** — JWT sign/verify, AuthGuard, RolesGuard, AuthController, MessagingController have zero automated tests. Only E2E flow test exists.
5. **No web frontend tests** — All 16 web files have zero tests. Cannot verify frontend behavior automatically.
6. **Password VO complexity beyond spec** — Enforces uppercase + lowercase + digit beyond the spec's "minimum 8 characters". Spec-compliant passwords may be rejected.
7. **`Password` complexity rules beyond spec** — Same as above, violates POLA (Principle of Least Astonishment) for users with simple passwords.

### Nice to Have
8. **Coverage thresholds** — No coverage configuration in any test runner.
9. **CSS as single file** — 580 line `styles.css`. Component-level styles would be more maintainable.
10. **Registration page (web)** — No web UI for user registration. Requires API call or admin action.

## Recommendations for Next Change

### For "Adjuntos / FileStorage" (Entrega 2):
1. **Start with the FileStorage port in domain** — `IFileStorage` with `upload(file): FileId`, `getUrl(fileId): string`. Follow the same port/adapter pattern as AuthPort.
2. **Prisma migration** — Add `attachments` table + `message_attachments` join table. Run `prisma migrate dev` from existing schema.
3. **Add multiple recipients support** — The schema already supports it (MessageRecipient table), but the web UI needs recipient multi-select.
4. **Fix refresh token storage** — This is a security gap. Add RefreshToken table to schema and validate against DB.
5. **Start implementing infrastructure tests** — JWT, guards, and controller tests should be added before the codebase grows.
6. **Consider CTE for thread queries** — Current thread reconstruction walks the parentMessageId chain recursively. PostgreSQL recursive CTE would be more performant at scale.

### For Overall Project Health:
7. **Set up coverage thresholds** — Configure minimum coverage (80% recommended) before Entrega 3.
8. **Add CI pipeline** — GitHub Actions or similar with lint → type-check → test → build stages.
9. **Prisma migration** — Generate initial migration with `prisma migrate dev --name init` and commit it.

## Verification Status

| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Domain tests | 117/117 ✅ |
| API tests | 44/44 ✅ (after post-verify fixes) |
| Total tests | 161 passing |
| Verdict | **PASS WITH WARNINGS** (WARNINGS documented in Technical Debt) |
| Post-verify fixes applied | ✅ MessageId import, ✅ Unread filter (Pending+Delivered), ✅ Test UUIDs via reconstruct() |

## Engram Artifact References

| Artifact | Topic Key / Path |
|----------|-----------------|
| Proposal | `openspec/changes/archive/2026-05-13-mensajeria-core/proposal.md` |
| Spec (user-auth) | `openspec/specs/user-auth/spec.md` |
| Spec (messaging-core) | `openspec/specs/messaging-core/spec.md` |
| Design | `openspec/changes/archive/2026-05-13-mensajeria-core/design.md` |
| Tasks | `openspec/changes/archive/2026-05-13-mensajeria-core/tasks.md` |
| Verify Report | `openspec/changes/archive/2026-05-13-mensajeria-core/verify-report.md` + Engram `sdd/mensajeria-core/verify-report` |
| Apply Progress | Engram `sdd/mensajeria-core/apply-progress` |
| Archive Report | `openspec/changes/archive/2026-05-13-mensajeria-core/archive-report.md` + Engram `sdd/mensajeria-core/archive-report` |
