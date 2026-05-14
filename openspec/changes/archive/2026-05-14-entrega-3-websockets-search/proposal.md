# Proposal: Entrega 3 — WebSockets + Full-text Search

## Intent

Agregar notificaciones en tiempo real y búsqueda full-text sobre mensajes. Los usuarios necesitan ver mensajes nuevos sin recargar la página y poder buscar en su historial de mensajes.

## Scope

### In Scope
- Gateway WebSocket con auth JWT + rooms por userId
- Bridge EventBus → Gateway (message:new, message:read)
- Fix bug: publicar evento en reply-to-message.use-case.ts
- SocketContext + listener en Web (message:new refresca inbox)
- search() en MessageRepository (PostgreSQL tsvector + índice GIN)
- SearchMessagesUseCase con control de acceso
- GET /v1/messages/search?q=&page=&pageSize=
- SearchPage o componente de búsqueda en Web

### Out of Scope
- Notificaciones push mobile | WebSockets en Expo
- Indicador "escribiendo…" / typing indicator
- Online/offline status

## Capabilities

### New Capabilities
- `realtime-notifications`: Gateway WebSocket + bridge con EventBus para notificaciones servidor→cliente autenticado
- `message-search`: Búsqueda full-text con PostgreSQL tsvector, filtro por usuario autenticado

### Modified Capabilities
- `messaging-core`: Mensajes nuevos y lecturas emiten eventos real-time (message:new, message:read). R5 y R6 se extienden con este comportamiento.

## Approach

Gateway en `api/src/infrastructure/websocket/` con passport JWT handshake + room por userId. WebSocketHandler como EventHandler suscripto al EventBus existente. Fix: reply-to-message usa `this.eventBus.publish(event)` en vez de `void event`. search() usa `to_tsvector('spanish', body || subject)` + `to_tsquery()` con índice GIN. SearchQueryDTO con validación (q requerido, paginación default). SocketContext en Web se conecta en AuthProvider, escucha `message:new` para refrescar.

## Affected Areas

| Area | Impact | Desc |
|------|--------|------|
| `api/src/infrastructure/websocket/` | New | Gateway + WS auth guard |
| `api/src/application/event-handlers/` | New | WebSocketHandler bridgea eventos |
| `api/src/application/use-cases/reply-to-message.use-case.ts` | Modified | Fix event publish |
| `api/src/infrastructure/persistence/` | Modified | search() en PrismaMessageRepository |
| `api/src/application/use-cases/search/` | New | SearchMessagesUseCase |
| `api/src/presentation/controllers/` | Modified | GET /v1/messages/search |
| `api/src/domain/ports/` | Modified | MessageRepository + search() |
| `api/prisma/migrations/` | New | Raw SQL: tsvector + índice GIN |
| `web/src/context/SocketContext.tsx` | New | Conexión Socket.IO |
| `web/src/pages/` | Modified | InboxPage + SearchPage |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| WS reconnect con token expirado | Medium | Refresh antes de reconectar |
| tsvector performance | Low | Índice GIN; pageSize ≤ 100 |
| Bug reply event no publicado | High | Fix simple: void→publish() |

## Rollback Plan

Revert commits de WebSocket (gateway, handler, socket-context). Revert search endpoint (controller, use case, repo). Mantener fix del reply event — es independiente. Migración del índice GIN es aditiva — revertir con otra migración.

## Dependencies

- `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io` (API)
- `socket.io-client` (Web)

## Success Criteria

- [ ] Al enviar mensaje, receptor recibe `message:new` vía WS en <500ms
- [ ] Al marcar como leído, emisor recibe `message:read`
- [ ] reply-to-message publica evento correctamente (fix verificado)
- [ ] GET /v1/messages/search?q=term devuelve resultados con tsvector ranking
- [ ] SearchPage permite buscar y ver resultados paginados
- [ ] Tests unitarios + e2e pasan
