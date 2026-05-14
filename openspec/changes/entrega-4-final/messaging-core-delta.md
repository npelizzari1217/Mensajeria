# Delta Spec: messaging-core

**Change**: entrega-4-final
**Base spec**: openspec/specs/messaging-core/spec.md

## Modifications

### New: messageType field

Message entity ahora tiene `messageType: 'normal' | 'draft'`. Draft no se persiste como Message (usa Draft entity), pero Forward usa `messageType: 'forward'` para identificación.

Forward crea un nuevo Message con `messageType: 'forward'` y `forwardedFrom` metadata.

### New requirement: R8 — Forward

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 8.1 | Forward message | Sender/recipient del original | POST /v1/messages/:id/forward { recipientIds } | 201, new Message with forwardedFrom |
| 8.2 | Forward to group | Sender/recipient | POST /v1/messages/:id/forward { groupId } | 201, recipients resueltos del grupo |
| 8.3 | Forward no access | Neither sender nor recipient | POST /v1/messages/:id/forward | 403 |
