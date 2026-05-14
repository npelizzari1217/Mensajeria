# Design: Entrega 3 — WebSockets + Full-text Search

## Technical Approach

Dos capacidades independientes acopladas por el EventBus existente:

- **WebSockets**: Gateway Socket.IO en namespace `/messages`, auth JWT en handshake, rooms por userId. Un handler bridgea eventos del dominio (`MessageSent`, `MessageRead`) al gateway. Sin dependencia circular — el handler contiene una referencia al gateway, no al revés.
- **Search**: raw SQL con `to_tsvector('spanish', ...)` + índice GIN sobre `messages(subject, body)`. Se agrega `search()` al port `MessageRepository` y se implementa como raw query vía `PrismaService.$queryRaw`. Endpoint `GET /v1/messages/search`.
- **Bug fix**: `reply-to-message.use-case.ts` — inyectar `EventBus`, cambiar `void event` por `this.eventBus.publish(event)`.

## Architecture Decisions

### Socket.IO vs SSE nativo
| Option | Tradeoff | Decision |
|--------|----------|----------|
| SSE | Nativo HTTP, conexión unidireccional, no funciona en mobile, sin reconexión automática | ❌ |
| Socket.IO | Bidireccional, rooms, reconexión automática, fallback long-polling, **ya soportado por NestJS** | ✅ |

### Raw SQL vs Prisma para search
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Prisma | Sin soporte nativo de tsvector, requeriría `$queryRaw` igualmente | ❌ |
| Raw SQL | Control total sobre el query plan, `$queryRaw` es el patrón correcto. Índice GIN admin directo | ✅ |

### Rooms por userId vs conversationId
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Conversation rooms | Complejidad extra, reqiere mapeo conversación→miembros | ❌ |
| UserId rooms | Simple, cada usuario escucha sus eventos. El gateway decide a qué room emitir según `recipientIds` / `senderId` del evento | ✅ |

### In-process EventBus vs Redis
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Redis Pub/Sub | Escalable multi-instancia, overhead operativo | ❌ (fuera de scope) |
| In-memory (actual) | Sincrónico, suficiente para single-instancia MVP. El handler WS es async pero con catch | ✅ |

## Data Flow

```
POST /v1/messages
  → SendMessageUseCase.execute()
    → messageRepo.save()
    → eventBus.publish(MessageSent)
      → WebSocketHandler.handle(event)
        → messagingGateway.emitMessageNew(recipientIds, payload)
          → io.to(`user:${id}`).emit('message:new', payload)

PATCH /v1/messages/:id/read
  → MarkAsReadUseCase.execute()
    → recipient.markAsRead()
    → messageRepo.saveRecipient()
    → eventBus.publish(MessageRead)
      → WebSocketHandler.handle(event)
        → messagingGateway.emitMessageRead(senderId, payload)
          → io.to(`user:${senderId}`).emit('message:read', payload)

GET /v1/messages/search?q=...
  → SearchMessagesUseCase.execute(query, userId, pagination)
    → messageRepo.search(userId, query, pagination)
      → $queryRaw`SELECT ... FROM messages ... WHERE to_tsvector(...) @@ plainto_tsquery(...)`
    → Result<PaginatedResult<Message>, DomainError>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/src/infrastructure/websocket/messaging.gateway.ts` | Create | Gateway Socket.IO, auth middleware, rooms, emit |
| `api/src/infrastructure/websocket/ws-auth.middleware.ts` | Create | Extrae JWT del handshake, verifica, asigna userId |
| `api/src/infrastructure/websocket/websocket.module.ts` | Create | Module NestJS exporta gateway |
| `api/src/application/event-handlers/websocket.handler.ts` | Create | Bridge EventBus → Gateway |
| `api/src/application/messaging/use-cases/search-messages.use-case.ts` | Create | SearchMessagesUseCase con validación + paginación |
| `api/src/presentation/messaging/dto/search-messages.request.ts` | Create | QueryDTO con q, page, pageSize |
| `api/prisma/migrations/<timestamp>_add_fts_index/` | Create | Raw SQL: CREATE INDEX CONCURRENTLY + tsvector |
| `packages/domain/src/messaging/repositories/message-repository.ts` | Modify | Agregar `search()` al port |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-message.repository.ts` | Modify | Implementar `search()` con raw SQL |
| `api/src/application/messaging/use-cases/reply-to-message.use-case.ts` | Modify | Inyectar EventBus, fix `void event` → `publish()` |
| `api/src/presentation/messaging/messaging.controller.ts` | Modify | Agregar `GET /messages/search` endpoint |
| `api/src/presentation/messaging/messaging.module.ts` | Modify | Proveer SearchMessagesUseCase, WebSocketModule |
| `api/src/app.module.ts` | Modify | Importar WebSocketModule |
| `api/src/infrastructure/event-bus/event-bus.module.ts` | Modify | Suscribir WebSocketHandler |
| `web/src/contexts/socket.context.tsx` | Create | SocketContext con conexión auth + listener message:new |
| `web/src/App.tsx` | Modify | Agregar SearchPage route, SocketProvider wrapper |
| `web/src/pages/inbox.page.tsx` | Modify | Escuchar message:new para refrescar lista |
| `web/src/pages/search.page.tsx` | Create | SearchPage con input + resultados |

## Interfaces / Contracts

### MessageRepository — search() port addition
```typescript
export interface MessageRepository {
  // ... existing methods

  search(
    userId: UserId,
    query: string,
    pagination: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>>;
}
```

### Search endpoint
```
GET /v1/messages/search?q={string}&page={number}&pageSize={number}
Authorization: Bearer {token}

Response 200:
{
  "data": [ /* MessageResponse[] */ ],
  "total": number,
  "page": number,
  "pageSize": number
}

Response 422:
{ "error": { "message": "'q' must be at least 2 characters" } }
```

### WebSocket events (server → client)
```typescript
// Event: message:new
interface MessageNewPayload {
  messageId: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  sentAt: string;
}

// Event: message:read
interface MessageReadPayload {
  messageId: string;
  recipientId: string;
  readAt: string;
}
```

### Raw SQL for search
```sql
SELECT m.*
FROM messages m
WHERE
  m.sender_id = :userId
  OR m.message_id IN (
    SELECT mr.message_id
    FROM message_recipients mr
    WHERE mr.recipient_id = :userId
  )
  AND (
    to_tsvector('spanish', coalesce(m.subject, '') || ' ' || coalesce(m.body, ''))
    @@ plainto_tsquery('spanish', :query)
  )
ORDER BY ts_rank(
  to_tsvector('spanish', coalesce(m.subject, '') || ' ' || coalesce(m.body, '')),
  plainto_tsquery('spanish', :query)
) DESC
LIMIT :pageSize OFFSET :offset;
```

### Migration SQL
```sql
-- Add tsvector column (generated)
ALTER TABLE messages ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(subject, '') || ' ' || coalesce(body, ''))
  ) STORED;

-- GIN index on generated column
CREATE INDEX CONCURRENTLY idx_messages_fts ON messages USING GIN(fts);
```

## Web Frontend Changes

### SocketContext
- Se conecta a `ws://<host>/messages` con `auth: { token: getAccessToken() }`
- Escucha `message:new` → invoca callback registrado por InboxPage
- Se desconecta en logout
- Se reconecta automáticamente (built-in Socket.IO): si el token expiró, el middleware rechaza → el client recibe `connect_error` → interceptor refresca JWT via REST antes de reconectar

### SearchPage
- Input de búsqueda + botón
- Debounce 300ms en onChange
- GET `/v1/messages/search?q=...` con paginación
- Resultados en tabla similar a inbox.page

### InboxPage — WS listener
- Al recibir `message:new`, refrescar lista (re-fetch de inbox)
- Alternativa: insertar en estado local sin re-fetch (preferido para UX, pero el re-fetch es más simple y no requiere merge de estado)

## Migration Plan

1. **Bug fix**: injectar EventBus en `ReplyToMessageUseCase`, publicar evento. Tests unitarios.
2. **Search**: agregar `search()` al port domain → implementar raw SQL + migración índice GIN → `SearchMessagesUseCase` → endpoint.
3. **WebSocket**: gateway + auth middleware → websocket module → WebSocketHandler → suscribir en EventBusModule → importar en AppModule.
4. **Web**: SocketContext → conectar en AuthProvider → SearchPage → inbox listener.

Rollback: revertir commits de WS y search. El fix del bug es permanente. Índice GIN es aditivo.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dependencia circular handler↔gateway | Medium | Handler recibe gateway via DI directa (no circular). Gateway no referencia al handler |
| Token expirado en reconnect | Medium | Socket.IO `connect_error` → app refresca JWT vía REST → reconecta con nuevo token |
| Search performance sin índice | Low | `CREATE INDEX CONCURRENTLY` en migración. Sin índice, query degrada a sequential scan (lento pero funcional). Log de warning si `EXPLAIN ANALYZE` muestra seq scan |
| EventBus bloqueante | Low | Handler es async con `.catch()` — si el gateway falla, el error se captura, el evento igual se consumió |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | SearchMessagesUseCase (validación), fix reply bug | Mock MessageRepository, verificar eventBus.publish llamado |
| Unit | WebSocketHandler | Mock gateway, emitir eventos, verificar llamadas al gateway |
| Integ | PrismaMessageRepository.search() | Base de datos de test, insertar mensajes, verificar resultados FTS |
| Integ | Gateway auth middleware | Simular handshake con JWT válido/inválido |
| E2E | Flujo completo: send → WS message:new → search | Supertest + Socket.IO client |

## Open Questions

- [ ] ¿El inbox listener debería re-fetch completo o merge parcial del nuevo mensaje en estado?
- [ ] ¿`pageSize` máximo debe validarse en controller o en use case? (por ahora en controller con guard)
