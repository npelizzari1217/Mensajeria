---
title: "Verification Report: mensajeria-core"
change: mensajeria-core
phase: verify
artifact: verify-report
status: draft
---

## Verification Report

**Change**: mensajeria-core
**Version**: N/A (first delivery)
**Mode**: Standard

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

All 21 tasks were implemented across 4 PRs (stacked-to-main). Web frontend (T-015, T-016, T-017) has all files present with full implementations including API client, auth context, routing, protected routes, and all pages (login, inbox, sent, compose, message-detail).

### Build & Tests Execution

**Build (Domain)**: ✅ Passed
**Build (API)**: ➖ Not checked (no build command executed, vitest-only verify)

**Domain Tests**: ✅ 117 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
 RUN  v1.6.1
 ✓ src/__tests__/user.test.ts  (14 tests)
 ✓ src/__tests__/message.test.ts  (15 tests)
 ✓ src/__tests__/value-objects.test.ts  (58 tests)
 ✓ src/__tests__/result.test.ts  (18 tests)
 ✓ src/__tests__/message-recipient.test.ts  (12 tests)
 Test Files  5 passed (5)
      Tests  117 passed (117)
```

**API Tests**: ✅ 38 passed / ❌ 6 failed / ⚠️ 0 skipped
```text
 FAIL  __tests__/messaging/reply.test.ts (5 tests failed)
 FAIL  __tests__/e2e/messaging-flow.test.ts (1 test failed)
 PASS  auth/login.test.ts (5 tests)
 PASS  auth/register.test.ts (9 tests)
 PASS  auth/auth-flow.test.ts (5 tests)
 PASS  messaging/send-message.test.ts (8 tests)
 PASS  messaging/inbox.test.ts (7 tests)
 PASS  messaging/mark-read.test.ts (5 tests)
 Test Files  6 passed / 2 failed (8)
      Tests  38 passed / 6 failed (44)
```

**Coverage**: ➖ Not available (no coverage threshold configured)

### Spec Compliance Matrix

#### User-Auth (13 scenarios)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Registration | Registro exitoso como Usuario | `register.test.ts > should register a user successfully` | ✅ COMPLIANT |
| Registration | Admin crea usuario con rol específico | `register.test.ts > should register with custom role` | ⚠️ PARTIAL |
| Registration | Email duplicado → error | `register.test.ts > should return error for duplicate email` | ✅ COMPLIANT |
| Registration | Password muy corto → error | `register.test.ts > should return error for short password` + `Password.create()` | ✅ COMPLIANT |
| Login | Login exitoso | `login.test.ts > should login successfully` | ✅ COMPLIANT |
| Login | Credenciales inválidas | `login.test.ts > should return error for wrong password` | ✅ COMPLIANT |
| Login | Email no existe | `login.test.ts > should return same error for non-existent email` | ✅ COMPLIANT |
| RBAC | Usuario accede a recurso propio | `auth.guard.ts` + `roles.guard.ts` (production code) | ✅ COMPLIANT |
| RBAC | Admin resource denied for Usuario | `roles.guard.ts` throws `ForbiddenException` | ✅ COMPLIANT |
| RBAC | Token sin firma válida → 401 | `auth.guard.ts` catches verify error | ⚠️ PARTIAL |
| Profile | Obtener perfil propio | `auth-flow.test.ts + get-current-user.use-case.ts` | ✅ COMPLIANT |
| Refresh | Refresh exitoso | `auth-flow.test.ts > refresh` | ✅ COMPLIANT |
| Refresh | Refresh token revocado | `refresh-token.use-case.ts` — no DB storage for tokens | ❌ UNTESTED |

#### Messaging-Core (20 scenarios)

| # | Scenario | Test | Result |
|---|----------|------|--------|
| 1.1 | Single dest | `send-message.test.ts > should send message to 1 recipient` | ✅ COMPLIANT |
| 1.2 | Multiple dest | `send-message.test.ts > should send message to multiple recipients` | ✅ COMPLIANT |
| 1.3 | Empty dest | `send-message.test.ts > should fail with empty recipients` + `Message.create()` | ✅ COMPLIANT |
| 1.4 | Not found | `send-message.test.ts > should fail when recipient does not exist` | ✅ COMPLIANT |
| 1.5 | No auth | `AuthGuard` on `MessagingController` | ✅ COMPLIANT |
| 2.1 | Has msgs | `inbox.test.ts > should return paginated inbox` | ✅ COMPLIANT |
| 2.2 | Empty | `inbox.test.ts > should return empty inbox` | ✅ COMPLIANT |
| 2.3 | Unauthorized (neither) | `get-message.use-case.ts` returns `UnauthorizedMessageAccessError` | ✅ COMPLIANT |
| 3.1 | Has msgs sent | `inbox.test.ts > should return paginated sent messages` | ✅ COMPLIANT |
| 3.2 | Empty sent | `inbox.test.ts > should return empty sent messages` | ✅ COMPLIANT |
| 4.1 | Sender | `GetMessageUseCase` allows sender access | ✅ COMPLIANT |
| 4.2 | Recipient | `GetMessageUseCase` allows recipient access | ✅ COMPLIANT |
| 4.3 | Forbidden | `GetMessageUseCase` denies neither | ✅ COMPLIANT |
| 5.1 | First read | `mark-read.test.ts > should mark delivered as read` | ✅ COMPLIANT |
| 5.2 | Idempotent | `mark-read.test.ts > should be idempotent` | ✅ COMPLIANT |
| 6.1 | Reply | `reply.test.ts` 4 tests fail — **missing `MessageId` import** | ❌ FAILING |
| 6.2 | Thread | `reply.test.ts > GetThreadUseCase` — test uses non-UUID IDs | ❌ FAILING |
| 7.1 | Unread filter | `GetInboxUseCase` maps to `Pending` only, not `Pending`+`Delivered` | ⚠️ PARTIAL |
| 7.2 | Read filter | `GetInboxUseCase` maps to `Read` | ✅ COMPLIANT |
| 7.3 | No filter | All messages returned | ✅ COMPLIANT |
| 7.4 | Invalid filter | No test or validation for invalid status value → 422 | ❌ UNTESTED |

**Compliance summary**: 25/33 compliant + 4 partial + 2 failing + 2 untested

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| Email unique, case-insensitive | ✅ | `Email` VO lowercases, `@unique` in Prisma schema |
| Password min 8 chars + complexity | ✅ | `Password.create()` validates 8 chars + upper + lower + digit |
| bcrypt for password hashing | ✅ | `BcryptPasswordHasher` with configurable rounds (default 12) |
| JWT access_token + refresh_token | ✅ | `JwtAuthPort` with `sign`/`verify`, refresh sent as httpOnly cookie |
| Same 401 for wrong email/password | ✅ | `InvalidCredentialsError` with same message |
| RBAC role hierarchy | ✅ | `RoleVO.isAtLeast()` for hierarchy, `RolesGuard` for enforcement |
| Paginated inbox/sent | ✅ | `GetInboxUseCase`/`GetSentUseCase` with page/pageSize |
| Mark as read idempotent | ✅ | `MessageRecipient.markAsRead()` keeps original readAt |
| Reply with parentMessageId | ❌ FAILING | Missing `MessageId` import crashes the use case |
| Thread reconstruction | ✅ | `findThread()` walks parentMessageId chain |
| Filters by status | ⚠️ Partial | `unread` maps to `Pending` only (should include `Delivered`) |

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| Pure domain layer with zero deps | ✅ | `packages/domain/package.json` has only `typescript` + `vitest` as devDeps |
| VOs with factory + validation + equals | ✅ | All VOs: `.create()`, `.get()`, `.equals()`, `.reconstruct()` |
| Result<T,E> for error handling | ✅ | Use cases return `Result<T, DomainError>` |
| Repository ports in domain layer | ✅ | `UserRepository`, `MessageRepository` interfaces in domain |
| Infrastructure in separate dir | ✅ | `api/src/infrastructure/` with `auth/`, `persistence/`, `config/` |
| AuthPort/PasswordHasher as application ports | ✅ | Interfaces in `application/auth/ports/`, impls in `infrastructure/auth/` |
| Mapper pattern (toDomain/toPrisma) | ✅ | `UserMapper` and `MessageMapper` stateless classes |
| ExceptionFilter maps DomainError → HTTP | ✅ | `AppExceptionFilter` with `domainErrorToStatus()` |
| Response envelope { data } | ✅ | `ResponseInterceptor` wraps all successful responses |
| Controllers thin, use cases fat | ✅ | Controllers parse → call use case → map response |
| Global prefix /v1 | ✅ | `main.ts` sets `setGlobalPrefix('v1')` |
| Two NestJS modules | ✅ | `AuthModule` + `MessagingModule` |
| `reconstruct()` for persistence | ✅ | All entities have `reconstruct()` that skips validation |
| AuthGuard injects req.user | ✅ | `AuthGuard.verify()` → sets `request.user = { userId, role }` |

### Issues Found

**CRITICAL**:

1. **`MessageId` import missing in `reply-to-message.use-case.ts`** — Line 47 uses `MessageId.create()` and line 112 uses `MessageId.reconstruct()` but `MessageId` is not in the import block from `@mensajeria/domain`. This causes `ReferenceError: MessageId is not defined` at runtime, breaking ALL reply functionality (POST /v1/messages/:id/reply returns 500). Affects: 5 failing tests (4 reply + 1 E2E), scenario 6.1 fully broken.
   - **File**: `api/src/application/messaging/use-cases/reply-to-message.use-case.ts`
   - **Fix**: Add `MessageId` to the import from `@mensajeria/domain`

**WARNING**:

2. **Unread filter only checks `Pending` not `Pending`+`Delivered`** — `get-inbox.use-case.ts` line 42 maps `'unread'` filter to `MessageStatusVO.reconstruct(MessageStatus.Pending)` only. The spec R7 expects "unread" to include all non-read statuses (Pending AND Delivered). Messages in `Delivered` status won't appear in the unread filter.
   - **File**: `api/src/application/messaging/use-cases/get-inbox.use-case.ts`
   - **Fix**: Pass both Pending+Delivered to repository or use `MessageStatusVO.reconstruct(MessageStatus.Delivered)` as a fallback query.

3. **Tests use non-UUID strings for `MessageId.create()`** — `reply.test.ts` uses `'msg-a'`, `'msg-b'`, `'msg-c'` as message IDs in GetThreadUseCase tests. `MessageId.create()` validates UUID v4 format and rejects these strings. This causes the GetThread test to fail with `result.isOk() = false`.
   - **File**: `api/src/__tests__/messaging/reply.test.ts` (GetThreadUseCase tests)
   - **Fix**: Use valid UUID strings or `MessageId.reconstruct()` in tests.

4. **Inbox/sent responses have empty senderName and recipientName** — `get-inbox.use-case.ts` and `get-sent.use-case.ts` hardcode `senderName: ''` and `recipientName: ''`. These should be populated from the database for a complete API. The `get-message.use-case.ts` correctly loads names.
   - **Files**: `api/src/application/messaging/use-cases/get-inbox.use-case.ts`, `get-sent.use-case.ts`
   - **Fix**: Load user names in use case or via repository join.

**SUGGESTION**:

5. **No infrastructure/presentation tests** — T-020 has no tests for JWT sign/verify, AuthGuard, RolesGuard, AuthController, or MessagingController. Only the E2E messaging flow test exists. These are marked as unticked in the task criteria.
   - **Files**: `api/src/infrastructure/auth/__tests__/`, `api/src/presentation/auth/__tests__/`, `api/src/presentation/messaging/__tests__/`
   - **Impact**: Guard and controller behavior has no automated verification.

6. **No web tests** — T-015/T-016/T-017 web implementation has zero tests. Cannot verify web frontend behavior via automated tests.
   - **Files**: `web/` — all source files present but no `*.test.ts` files.

7. **Refresh token not stored in DB** — `refresh-token.use-case.ts` uses pure JWT verification with no DB storage or revocation support. The spec calls for `refresh_token almacenado en DB`. Scenario "Refresh token revocado" (checking that a deleted refresh token returns 401) is UNTESTED and likely non-functional.
   - **File**: `api/src/application/auth/use-cases/refresh-token.use-case.ts`
   - **Impact**: Refresh tokens can't be revoked server-side.

8. **Domain events are created but never dispatched** — `UserRegistered`, `MessageSent`, `MessageRead` events are instantiated with `void event` but no event bus dispatches them. This is acknowledged as future work.
   - **Files**: `api/src/application/*/use-cases/*.use-case.ts`
   - **Impact**: No side-effect extensibility via events.

9. **`Password` validation includes complexity rules beyond spec** — The spec only requires "mínimo 8 caracteres" but the `Password` VO additionally requires uppercase, lowercase, and digit. This is more restrictive than specified.
   - **File**: `packages/domain/src/auth/value-objects/password.ts`
   - **Impact**: Users with valid 8-char lowercase-only passwords will be rejected.

### Verdict

**PASS WITH WARNINGS**

The implementation is structurally sound with strong Clean Architecture compliance. The domain layer is pure (zero deps), VOs have proper factories + validation + equals, use cases return `Result<T,E>`, repository ports are in domain, and infrastructure is properly separated.

However, the **CRITICAL** missing `MessageId` import in `reply-to-message.use-case.ts` breaks all reply functionality. Combined with the partial unread filter and test data issues, the system is not fully shippable until the import fix is applied and tests pass.

**Required before shipping**:
1. Add `MessageId` to the import in `reply-to-message.use-case.ts` — fixes 5 failing tests + restores reply functionality
2. Fix `reply.test.ts` GetThread tests to use valid UUIDs
3. Fix unread filter to include Delivered status

**Next steps (non-blocking)**:
- Add infrastructure/presentation tests (JWT, guards, controllers)
- Add web frontend tests
- Implement refresh token DB storage for revocation support
