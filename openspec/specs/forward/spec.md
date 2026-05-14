---
title: "forward Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: forward
status: draft
---

# Forward — Specification

## Purpose

Reenviar un mensaje existente a nuevos destinatarios. Incluye el contenido original como cita y verifica que quien reenvía tenga acceso al mensaje original.

## Requirements

### R1: Reenviar mensaje

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Forward como sender | Es sender del original | POST /v1/messages/:id/forward { recipientIds } | 201, nuevo Message con forwardedFrom, recipients |
| 1.2 | Forward como recipient | Es recipient del original | POST /v1/messages/:id/forward { recipientIds } | 201, mismo comportamiento |
| 1.3 | Forward sin acceso | No es sender ni recipient | POST /v1/messages/:id/forward | 403 |
| 1.4 | Forward con comentario | Auth y acceso | POST /v1/messages/:id/forward { recipientIds, comment } | 201, body incluye comment + quote del original |
| 1.5 | Forward a grupo | Auth y acceso | POST /v1/messages/:id/forward { groupId } | 201, recipients resueltos del grupo |

### R2: Response shape

El nuevo mensaje creado por forward DEBE incluir:
- `forwardedFrom: { messageId, senderName, subject, body, sentAt }`
- `body`: si incluye comment, es `comment\n\n---\n\n> {original body}`, si no, es `> {original body}`
- Resto de campos normales de Message

### R3: Control de acceso

- Sender y recipients del mensaje original PUEDEN reenviar
- Usuarios sin acceso NO pueden reenviar (403)
- El forward NO modifica el mensaje original
- Los nuevos recipients NO ganan acceso al original (a menos que ya lo tuvieran)
