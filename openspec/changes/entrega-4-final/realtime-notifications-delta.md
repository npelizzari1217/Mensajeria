# Delta Spec: realtime-notifications

**Change**: entrega-4-final
**Base spec**: openspec/specs/realtime-notifications/spec.md

## Modifications

### New requirement: R4 — Push Notifications Bridge

Cuando un evento `MessageSent` se publica y el/los recipients NO están conectados via WebSocket, el EventBusHandler DEBE enviar push notification vía FCM a los dispositivos registrados.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 4.1 | Recipient offline | No socket conectado | `MessageSent` publicado | Push FCM enviado a todos los DeviceToken del recipient |
| 4.2 | No devices registered | Recipient offline sin tokens | `MessageSent` publicado | Handler loguea warning, no error |
| 4.3 | FCM fails | Firebase devuelve error | Handler procesa | Error logueado, no propaga, no bloquea |

### Modified: R3.2 (Offline behavior)

Original: "Offline: handler logs warning, no crash"
Nuevo: "Offline: handler registra push notification y la envía via FCM. Si push falla, loguea warning, no crash"
