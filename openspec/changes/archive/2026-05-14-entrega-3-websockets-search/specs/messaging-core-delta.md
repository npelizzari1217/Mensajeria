---
title: "messaging-core Delta"
change: entrega-3-websockets-search
phase: spec
artifact: delta-spec
domain: messaging-core
status: draft
---

# Delta for messaging-core

## MODIFIED Requirements

### Requirement: R1 — Send Message

MUST create Message + 1+ MessageRecipient for authenticated user.
MUST publish MessageSent event via EventBus.
MUST emit `message:new` via WebSocket to all recipients after persistence.
(Previously: no WebSocket emission)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Single dest | valid JWT | POST subject, body, 1 recipientId | 201, 1 MessageRecipient (pending) |
| 1.2 | Multiple dest | authenticated | POST 3 recipientIds | 201, 3 MessageRecipient records |
| 1.3 | Empty dest | authenticated | POST recipients=[] | 422 |
| 1.4 | Not found | authenticated | POST nonexistent userId | 404 |
| 1.5 | No auth | no JWT | POST any | 401 |
| 1.6 | Real-time WS | 1 recipient connected via WS | POST message to them | message:new WS event to recipient room in <500ms |

### Requirement: R5 — Mark as Read

Recipient MUST mark message read. Idempotent.
MUST emit `message:read` via WebSocket to the original sender.
(Previously: no WebSocket emission)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 5.1 | First read | status=delivered | PATCH /messages/:id/read | 200, status→read, readAt set, message:read emitted to sender |
| 5.2 | Idempotent | already status=read | PATCH /messages/:id/read | 200, readAt unchanged, no duplicate event emitted |

### Requirement: R6 — Reply

Authorized user MUST reply setting parentMessageId. Thread SHALL reconstruct via chain.
MUST publish MessageSent event via EventBus (fix: was `void event` instead of `this.eventBus.publish(event)`).
MUST emit `message:new` via WebSocket to recipients.
(Previously: event was created but NOT published via EventBus; no WebSocket emission)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 6.1 | Reply | can view message ABC | POST parentMessageId=ABC | 201, new Message, MessageSent published via EventBus |
| 6.2 | Thread | chain A→B(A)→C(B) | GET /messages/:A/thread | 200, 3 msgs sentAt ASC |
| 6.3 | Real-time WS | 1 recipient connected via WS | POST reply | message:new WS event to recipient room in <500ms |
