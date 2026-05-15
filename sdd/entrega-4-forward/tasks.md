# Tasks: PR 4 — Forward

## Workload Forecast
- Estimated lines: ~150
- 400-line budget: Low risk

## Task List

### Domain
- [ ] 4.1 Create `ForwardedContent` value object in `packages/domain/src/messaging/value-objects/forwarded-content.ts`
- [ ] 4.2 Export from `packages/domain/src/index.ts`

### Application
- [ ] 4.3 Create `ForwardMessageDTO` in `api/src/application/messaging/dtos/forward-message.dto.ts`
- [ ] 4.4 Create `ForwardMessageUseCase` — verify access, copy with quote, create new Message, publish event

### Presentation
- [ ] 4.5 Extend `MessagingController` with `POST /v1/messages/:id/forward`

### Testing
- [ ] 4.6 Tests: forward as sender, as recipient, without access, with comment (5+ tests)
