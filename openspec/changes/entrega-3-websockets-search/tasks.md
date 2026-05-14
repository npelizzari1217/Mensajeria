# Tasks: Entrega 3 — WebSockets + Full-text Search

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~760 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Fix + Search API) → PR 2 (WebSockets API) → PR 3 (Web Integration) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Bug fix reply event + search API full-text | PR 1 → main | ~320 lines. Self-contained: domain port, use case, raw SQL, migration, endpoint |
| 2 | WebSocket gateway + handler bridge | PR 2 → main | ~260 lines. Independent from PR 1. Gateway, auth middleware, EventBus handler |
| 3 | Web: socket context, inbox listener, search page | PR 3 → main | ~180 lines. Depends on PR 1 (search endpoint) and PR 2 (WS gateway) |

## Phase 1: Foundation / Domain Changes

- [x] 1.1 Fix `reply-to-message.use-case.ts` — inject `EventBus`, replace `void event` with `this.eventBus.publish(event)`
- [x] 1.2 Add `search(userId, query, pagination)` signature to `MessageRepository` port in domain
- [x] 1.3 Create migration: add GIN index on `messages` for full-text search

## Phase 2: Core Implementation — Search (API)

- [x] 2.1 Create `SearchMessagesUseCase` in `application/messaging/use-cases/` with validation + pagination
- [x] 2.2 Implement `search()` in `PrismaMessageRepository` using `$queryRawUnsafe` with `to_tsvector`/`plainto_tsquery`
- [x] 2.3 Create `SearchQueryDTO` with `q`, `page`, `pageSize`, validation (min 2 chars for `q`)
- [x] 2.4 Add `GET /v1/messages/search` to `MessagingController`, wire through module

## Phase 3: Core Implementation — WebSockets (API)

- [ ] 3.1 Add `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` to `api/package.json`
- [ ] 3.2 Create `ws-auth.middleware.ts` — extract JWT from handshake, verify, attach userId to socket
- [ ] 3.3 Create `MessagingGateway` — namespace `/messages`, auth middleware, rooms by `user:{userId}`
- [ ] 3.4 Create `WebSocketModule` — exports `MessagingGateway`
- [ ] 3.5 Create `WebSocketHandler` — implements EventHandler, bridges `MessageSent`/`MessageRead` to gateway emits
- [ ] 3.6 Wire `WebSocketHandler` subscription in `EventBusModule.onModuleInit()`
- [ ] 3.7 Import `WebSocketModule` in `AppModule`, provide `SearchMessagesUseCase` in `MessagingModule`

## Phase 4: Web Integration

- [ ] 4.1 Add `socket.io-client` to `web/package.json`
- [ ] 4.2 Create `SocketContext` — connects to `/messages` with JWT auth, exposes `onMessageNew` callback
- [ ] 4.3 Modify `InboxPage` — register `message:new` listener via `SocketContext`, re-fetch inbox on event
- [ ] 4.4 Create `SearchPage` — search input with debounce, GET `/messages/search`, results table
- [ ] 4.5 Modify `App.tsx` — wrap with `SocketProvider`, add `/search` route

## Phase 5: Testing

- [x] 5.1 Unit test: `ReplyToMessageUseCase` publishes event after fix (mock EventBus, verify publish called)
- [x] 5.2 Unit test: `SearchMessagesUseCase` validates query param, delegates to repo
- [ ] 5.3 Integration test: `PrismaMessageRepository.search()` with tsvector ranking
- [ ] 5.4 Unit test: `MessagingGateway` auth — JWT handshake grants access, invalid JWT rejected
- [ ] 5.5 Unit test: `WebSocketHandler` — mock gateway, emit domain events, verify gateway emit calls
- [ ] 5.6 E2E test: send message → WS `message:new` → search for it
