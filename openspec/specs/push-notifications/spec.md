---
title: "push-notifications Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: push-notifications
status: draft
---

# Push Notifications — Specification

## Purpose

Notificar al usuario en su dispositivo mobile cuando recibe un nuevo mensaje y la app no está en foreground. Usa Firebase Cloud Messaging (FCM).

## Modelo

- **DeviceToken**: id, userId, token (string), platform (ios|android), createdAt, updatedAt
- Almacenado en BD para envío server-side

## Requirements

### R1: Registrar device token

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Registrar | Auth, app abierta | POST /v1/devices { token, platform } | 201, token registrado |
| 1.2 | Re-registrar mismo token | Token ya existe | POST /v1/devices { token, platform } | 200, updatedAt actualizado |
| 1.3 | Token inválido | Token vacío | POST /v1/devices { token: '' } | 422 |

### R2: Eliminar device token (logout)

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | Logout | Auth | DELETE /v1/devices/:token | 204 |
| 2.2 | Logout all | Auth | DELETE /v1/devices | 204, todos los tokens del usuario eliminados |

### R3: Enviar push en MessageSent

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Recipient online | Recipient conectado por WS | MessageSent publicado | Solo WS, NO push |
| 3.2 | Recipient offline | Recipient NO conectado | MessageSent publicado | Push FCM a sus dispositivos |
| 3.3 | Múltiples dispositivos | Usuario con 2 devices | MessageSent publicado | Push a ambos devices |

### R4: Payload de la push

```json
{
  "title": "Nuevo mensaje",
  "body": "{senderName}: {subject}",
  "data": {
    "type": "message:new",
    "messageId": "...",
    "senderId": "...",
    "senderName": "...",
    "subject": "..."
  }
}
```

### R5: Manejo de clic

- Al tocar la notificación → abrir app → navegar a Message Detail de `messageId`
- Si app ya está abierta → no mostrar notificación toast (ya llega por WS)

### R6: Configuración

- `FCM_SERVER_KEY` en environment vars
- Feature toggle `PUSH_ENABLED` para deshabilitar sin deploy
- Error silencioso si FCM no responde (no bloquear el envío del mensaje)
