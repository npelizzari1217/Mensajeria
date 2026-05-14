---
title: "data-export Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: data-export
status: draft
---

# Data Export — Specification

## Purpose

Exportar una conversación (thread) en formatos JSON y PDF. Para respaldo, documentación, o revisión offline.

## Requirements

### R1: Exportar thread

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Export JSON | Acceso al thread | GET /v1/messages/:id/thread/export?format=json | 200, Content-Type application/json, archivo descargable |
| 1.2 | Export PDF | Acceso al thread | GET /v1/messages/:id/thread/export?format=pdf | 200, Content-Type application/pdf, archivo descargable |
| 1.3 | Sin acceso | No sender ni recipient | GET /v1/messages/:id/thread/export | 403 |
| 1.4 | Formato inválido | Auth | GET ...?format=xml | 422 |

### R2: JSON shape

```json
{
  "exportedAt": "2026-05-14T...",
  "exportedBy": { "userId": "...", "name": "..." },
  "thread": [
    {
      "messageId": "...",
      "senderName": "...",
      "subject": "...",
      "body": "...",
      "sentAt": "...",
      "recipients": [ { "userId": "...", "name": "...", "status": "read" } ],
      "attachments": [ { "filename": "...", "mimeType": "...", "size": 1234, "url": "..." } ]
    }
  ]
}
```

### R3: PDF shape

- Header: "Mensajería - Exportación de conversación", fecha, usuario que exporta
- Cada mensaje: senderName, subject, body, sentAt, recipients
- Attachments listados con nombre y tipo (sin incluir el archivo binario)
- Footer: página X de Y, generado el {fecha}

### R4: Almacenamiento

- El PDF se genera en memoria y se sirve como descarga (no se persiste)
- Para archivos grandes, considerar streaming
