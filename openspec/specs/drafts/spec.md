---
title: "drafts Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: drafts
status: draft
---

# Drafts — Specification

## Purpose

Permitir guardar mensajes como borrador antes de enviarlos. Típico de comunicación formal.

## Modelo

- **Draft**: id, senderId, subject, body, recipientIds (string[] serializado), groupId (opcional), parentMessageId (opcional), createdAt, updatedAt
- Alternativa: reusar Message con `status=draft` + sin MessageRecipient + sin validación de recipients. Se elige esta por simplicidad.

## Requirements

### R1: Guardar borrador

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Guardar con subject+body | Auth | POST /v1/drafts { subject, body } | 201, draft creado sin enviar |
| 1.2 | Guardar con recipients opcionales | Auth | POST /v1/drafts { subject, body, recipientIds: [..] } | 201, recipients guardados |
| 1.3 | Guardar con groupId | Auth | POST /v1/drafts { subject, body, groupId } | 201 |
| 1.4 | Guardar como reply | Auth | POST /v1/drafts { subject, body, parentMessageId } | 201 |

### R2: Listar borradores

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | List propios | Auth con drafts | GET /v1/drafts | 200, drafts del usuario ordenados por updatedAt DESC |
| 2.2 | Vacío | Auth sin drafts | GET /v1/drafts | 200 [] |

### R3: Editar borrador

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Editar campos | Draft propio | PATCH /v1/drafts/:id { subject } | 200, updatedAt actualizado |
| 3.2 | Editar ajeno | Draft de otro | PATCH /v1/drafts/:id | 404 (no visible) |

### R4: Enviar borrador

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 4.1 | Enviar con recipients | Draft con recipientIds | POST /v1/drafts/:id/send | 201, Message creado, Draft eliminado |
| 4.2 | Enviar sin recipients | Draft sin recipientIds | POST /v1/drafts/:id/send | 422 (requiere recipients) |

### R5: Eliminar borrador

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 5.1 | Descartar | Draft propio | DELETE /v1/drafts/:id | 204 |
| 5.2 | Descartar ajeno | Draft de otro | DELETE /v1/drafts/:id | 404 |
