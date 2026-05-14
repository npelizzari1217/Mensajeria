---
title: "pinned-messages Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: pinned-messages
status: draft
---

# Pinned Messages — Specification

## Purpose

Permitir a usuarios marcar mensajes como importantes/pinned para acceso rápido. Específico por usuario (cada usuario pinnea independientemente).

## Modelo

- **UserPinnedMessage**: userId, messageId, pinnedAt
- Un mensaje puede estar pinneado por múltiples usuarios
- No hay límite de pinned por usuario (v1)

## Requirements

### R1: Pin / Unpin

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Pin message | Acceso al mensaje (sender/recipient) | POST /v1/messages/:id/pin | 204, pinned |
| 1.2 | Unpin message | Previamente pinneado | DELETE /v1/messages/:id/pin | 204, unpinned |
| 1.3 | Pin sin acceso | No sender ni recipient | POST /v1/messages/:id/pin | 403 |
| 1.4 | Pin duplicado | Ya pinneado | POST /v1/messages/:id/pin | 204, idempotente |

### R2: Listar pinned

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | List propios | Auth, 3 pinned | GET /v1/messages/pinned | 200, 3 mensajes con senderName, subject, sentAt, pinnedAt |
| 2.2 | Sin pinned | Auth, 0 pinned | GET /v1/messages/pinned | 200 [] |

### R3: UI indicators

- En inbox/sent/detail, mensaje pinneado muestra icono de pin
- Página separada `/messages/pinned` en web y mobile
