# Tasks: PR 5 — Pinned Messages

## Workload Forecast
- Estimated lines: ~200
- 400-line budget: Low risk

## Task List

### Infrastructure
- [ ] 5.1 Add `UserPinnedMessage` model to Prisma schema
- [ ] 5.2 Create Prisma migration

### Application
- [ ] 5.3 Create `PinMessageUseCase`
- [ ] 5.4 Create `UnpinMessageUseCase`
- [ ] 5.5 Create `ListPinnedMessagesUseCase`

### Presentation
- [ ] 5.6 Create `PinnedController` with 3 endpoints
- [ ] 5.7 Create `PinnedModule` and register in AppModule

### Web
- [ ] 5.9 Create `web/src/pages/pinned.page.tsx`
- [ ] 5.10 Add route + nav link
- [ ] 5.11 Add pin/unpin button in DetailPage

### Testing
- [ ] 5.8 Tests: pin, unpin, list, pin duplicado
