---
title: "messaging-core Specification"
change: mensajeria-core
phase: spec
artifact: spec
domain: messaging-core
status: draft
---

# messaging-core Specification

## Purpose

Authenticated users SHALL send, receive, reply, and filter text messages. No attachments, real-time, or mobile.

## Requirements

### R1: Send Message

MUST create `Message` + 1+ `MessageRecipient` for authenticated user.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Single dest | valid JWT | POST subject, body, 1 recipientId | 201, 1 MessageRecipient (pending) |
| 1.2 | Multiple dest | authenticated | POST 3 recipientIds | 201, 3 MessageRecipient records |
| 1.3 | Empty dest | authenticated | POST recipients=[] | 422 |
| 1.4 | Not found | authenticated | POST nonexistent userId | 404 |
| 1.5 | No auth | no JWT | POST any | 401 |

### R2: List Inbox

MUST return paginated messages where user is recipient. SHALL NOT expose others'.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | Has msgs | 5 received | GET /messages/inbox | 200: senderName, subject, status, sentAt |
| 2.2 | Empty | none received | GET /messages/inbox | 200 [] |
| 2.3 | Unauthorized | neither sender nor recipient | GET /messages/X | 403 |

### R3: List Sent

MUST return paginated messages user sent.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Has msgs | 3 sent | GET /messages/sent | 200: recipients, subject, sentAt |
| 3.2 | Empty | never sent | GET /messages/sent | 200 [] |

### R4: View Detail

MUST return full detail to sender and recipients only.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 4.1 | Sender | is sender | GET /messages/:id | 200: recipients, statuses, timestamps |
| 4.2 | Recipient | is recipient | GET /messages/:id | 200: sender info, body, sentAt |
| 4.3 | Forbidden | is neither | GET /messages/:id | 403 |

### R5: Mark as Read

Recipient MUST mark message read. Idempotent.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 5.1 | First | status=delivered | PATCH /messages/:id/read | 200, status→read, readAt set |
| 5.2 | Idempotent | already status=read | PATCH /messages/:id/read | 200, readAt unchanged |

### R6: Reply

Authorized user MUST reply setting parentMessageId. Thread SHALL reconstruct via chain.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 6.1 | Reply | can view message ABC | POST parentMessageId=ABC | 201, new Message with parentMessageId=ABC |
| 6.2 | Thread | chain A→B(A)→C(B) | GET /messages/:A/thread | 200, 3 msgs sentAt ASC |

### R7: Filters

MUST filter inbox/sent by status query param.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 7.1 | Unread | 5 inbox, 2 unread | GET /messages/inbox?status=unread | 2 results |
| 7.2 | Read | 5 inbox, 3 read | GET /messages/inbox?status=read | 3 results |
| 7.3 | No filter | 5 inbox | GET /messages/inbox | all 5 |
| 7.4 | Invalid | any | GET ?status=invalid | 422 |
