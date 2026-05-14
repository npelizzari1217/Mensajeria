---
title: "Archive Report: entrega-3-websockets-search"
change: entrega-3-websockets-search
phase: archive
artifact: archive-report
status: final
archived-at: 2026-05-14
---

# Archive Report: entrega-3-websockets-search

## Summary

Real-time notifications (WebSocket) + full-text search (PostgreSQL tsvector). Users can now receive new-message events without polling and search their message history. Delivered via 3 stacked-to-main PRs.

## What Was Implemented

### WebSocket Gateway (`api/src/infrastructure/websocket/`)
- **MessagingGateway**: Socket.IO on namespace `/messages`, JWT auth in `handleConnection`, per-user rooms (`user:{userId}`)
- **WebSocketHandler**: Bridges `MessageSent` → `message:new` to recipient room, `MessageRead` → `message:read` to sender room
- Gateway exported from `MessagingModule`, handler subscribed in `EventBusModule.onModuleInit()`

### Full-text Search
- **SearchMessagesUseCase**: Validates query (min 2 chars), paginates (default 20, max 100 clamped), filters by user access
- **PrismaMessageRepository.search()**: `$queryRawUnsafe` with `to_tsvector('spanish', ...)` / `plainto_tsquery('spanish', ...)`, access filter via `sender_id` or `message_recipients` join
- **Migration**: `CREATE INDEX CONCURRENTLY ... ON messages USING gin(to_tsvector('spanish', ...))`
- **Endpoint**: `GET /v1/messages/search?q=&page=&pageSize=` with `SearchQueryDTO`

### Bug Fix
- **ReplyToMessageUseCase**: Injected `EventBus`, replaced `void event` with `this.eventBus.publish(event)` — events now actually dispatched

### Web Frontend (`web/`)
- **SocketContext**: Connects to `/messages` with dynamic JWT auth, `message:new` listener triggers inbox refresh
- **SearchPage**: Search input, paginated results table, debounce-free (button-triggered)
- **InboxPage**: Listens for `message:new` → calls `fetchInbox()`
- **App.tsx**: Wraps `<SocketProvider>`, adds `/search` route

### Tests
- **Domain**: 134/134 passing (6 test files)
- **API**: 130/130 passing (17 test files — WebSocket handler, gateway auth, search use case, reply fix)
- **Web**: 10/10 passing (2 test files)
- **Total**: 274 tests, 0 failures

### 3 PRs Stacked-to-Main

| PR | Branch | Tasks | Focus | Est. LOC |
|----|--------|-------|-------|----------|
| #1 | `sdd/entrega-3-websockets-search/search-api` | 1.1–1.3, 2.1–2.4, 5.1–5.2 | Bug fix + Search API | ~320 |
| #2 | `sdd/entrega-3-websockets-search/websockets` | 3.1–3.7, 5.4–5.5 | WebSocket gateway + handler | ~260 |
| #3 | `sdd/entrega-3-websockets-search/web` | 4.1–4.5 | Web: socket context, search page, inbox listener | ~180 |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| messaging-core | Updated (delta merged) | R1 + R5 + R6 extended with EventBus/WS behavior; 3 scenarios added (1.6, 6.3), 4 modified |
| realtime-notifications | Already at spec path (new spec) | Created as new capability — no merge needed |
| message-search | Already at spec path (new spec) | Created as new capability — no merge needed |

### Delta Merge Details (messaging-core)

| Requirement | Action | Details |
|-------------|--------|---------|
| R1 — Send Message | Modified | Added EventBus publish + WS `message:new` emission; scenario 1.6 added |
| R5 — Mark as Read | Modified | Added WS `message:read` emission to sender; scenarios 5.1/5.2 updated |
| R6 — Reply | Modified | Added EventBus publish (fix) + WS `message:new`; scenario 6.1 updated, 6.3 added |

## Technical Decisions Made During Implementation

### Architecture
1. **Socket.IO over SSE**: Bidirectional, rooms, auto-reconnect, fallback long-polling. NestJS has first-class support via `@nestjs/websockets` + `@nestjs/platform-socket.io`.

2. **Raw SQL over Prisma for search**: Prisma has no tsvector support. `$queryRawUnsafe` gives full control over query plan and GIN index usage.

3. **Per-user rooms (not conversationId)**: Simpler — each user joins `user:{userId}`. Gateway decides target room from event payload (recipientIds or senderId).

4. **In-memory EventBus** (no Redis): Sufficient for single-instance MVP. Handler is async with `.catch()` — failure doesn't crash the bus.

5. **Handler references gateway (no circular dep)**: `WebSocketHandler` imports `MessagingGateway` via DI. Gateway never references the handler — clean dependency direction.

6. **GIN index on function-based expression** (vs generated column): `CREATE INDEX ... ON messages USING gin(to_tsvector(...))` instead of design's `GENERATED ALWAYS AS ... STORED`. Functionally equivalent, slightly simpler migration.

### Implementation Deviations from Design
7. **Search sort by `created_at DESC` instead of `ts_rank DESC`**: Documented warning in verify report. Relevance ranking is lost — results ordered by recency, not relevance. Recommend fix.

## Verification Status

| Metric | Value |
|--------|-------|
| Tasks total | 20 |
| Tasks complete | 18 (2 incomplete: integration test 5.3, E2E test 5.6) |
| Note | Phase 4 tasks (4.1–4.5) implemented in code but not marked `[x]` in tasks.md |
| Domain tests | 134/134 ✅ |
| API tests | 130/130 ✅ |
| Web tests | 10/10 ✅ |
| Total tests | **274 passing** |
| Verdict | **PASS WITH WARNINGS** |

### Warnings Carried Forward
1. **HTTP status mismatch**: Validation errors return 400 instead of spec's 422 — `exception.filter.ts` missing `ValidationError` mapping
2. **pageSize > 100 clamped silently** instead of returning 422 error as per spec
3. **Search sort order**: `created_at DESC` vs design's `ts_rank DESC` — no relevance ranking
4. **Task tracking outdated**: Phase 4 implemented but tasks.md not updated

## Archive Contents

| Artifact | Path |
|----------|------|
| Proposal | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/proposal.md` |
| Delta Spec (messaging-core) | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/specs/messaging-core-delta.md` |
| Design | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/design.md` |
| Tasks | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/tasks.md` |
| Verify Report | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/verify-report.md` |
| Archive Report | `openspec/changes/archive/2026-05-14-entrega-3-websockets-search/archive-report.md` |

## Source of Truth Updated

The following main specs now reflect the new behavior:
- `openspec/specs/messaging-core/spec.md` — delta merged (R1, R5, R6 extended with WebSocket + EventBus)
- `openspec/specs/realtime-notifications/spec.md` — new spec (unchanged)
- `openspec/specs/message-search/spec.md` — new spec (unchanged)
