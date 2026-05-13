---
title: "Exploration: Sistema de Mensajería Core"
change: mensajeria-core
phase: explore
artifact: exploration
status: draft
---

## Exploration: Sistema de Mensajería Core

### Current State
Greenfield project. Estructura de directorios creada (`api/`, `web/`, `mobile/`, `packages/domain/`) pero vacía. Stack acordado: NestJS + Prisma (backend), React (web), Expo + Tamagui (mobile). Clean Architecture con VOs, Result Types, Repository Pattern.

---

## 1. Modelo de Datos

### Entidades Principales (Aggregate Roots)

| Entidad | Descripción |
|-----------|-------------|
| `User` | Usuario del sistema con identidad, roles y contactos |
| `Message` | Mensaje principal (aggregate root) |
| `ConversationThread` | Hilo de conversación (agrupa mensajes relacionados) |
| `Attachment` | Archivo adjunto a un mensaje |
| `MessageRecipient` | Relación muchos-a-muchos con tracking de estado |

### Value Objects Propuestos

```typescript
// Identidad
- UserId (UUID)
- MessageId (UUID)
- ThreadId (UUID)
- AttachmentId (UUID)

// Valores de dominio
- Email (validación de formato)
- Subject (título del mensaje, longitud 5-200 chars)
- MessageBody (cuerpo, hasta 10MB sugerido)
- Role (Admin | Usuario | Supervisor | Técnico)
- MessageStatus (enviado | recibido | leído)
- FileMetadata (nombre, tamaño, MimeType)
- MimeType (validación de tipo de archivo)
```

### Relaciones

```
User 1 ── N Message (emisor)
Message N ── N User (receptores, via MessageRecipient)
Message 1 ── N Attachment
ConversationThread 1 ── N Message
Message 1 ── 1 ConversationThread (opcional: mensaje padre)
User N ── N User (Contactos — entidad separada)
```

### Tablas de BD (Prisma)

- `users`: id, email, password_hash, role, display_name, created_at
- `messages`: id, sender_id, thread_id, parent_message_id, subject, body, sent_at, created_at
- `message_recipients`: id, message_id, recipient_id, status, received_at, read_at, created_at
- `conversation_threads`: id, subject_original, created_at, updated_at
- `attachments`: id, message_id, file_storage_id, name, mime_type, size_bytes, created_at
- `contacts`: user_id, contact_user_id, created_at, PRIMARY KEY(user_id, contact_user_id)

---

## 2. Flujo de Mensajería

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMISOR (online/offline)                   │
│  1. Escribe mensaje + selecciona destinatarios + adjunta archivos│
│  2. UseCase: SendMessageUseCase.execute()                        │
│  3. Valida: permisos, contactos existen, tamaño adjuntos         │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MESSAGE AGGREGATE                          │
│  - Crea Message (status: draft → sent)                           │
│  - Crea MessageRecipient por cada destinatario (status: pending) │
│  - Persiste attachments via FileStoragePort                       │
│  - Emite DomainEvent: MessageSent                                 │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EVENT HANDLER: MessageSentHandler               │
│  1. Busca destinatarios ONLINE via ConnectionManager             │
│  2. Envía por WebSocket: `message:new` + payload                 │
│  3. Si Push tokens registrados → envía FCM/APNs push             │
│  4. No bloquea, no falla si WS cae (DB es fuente de verdad)     │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RECEPTOR ONLINE                            │
│  1. Recibe `message:new` por WebSocket                           │
│  2. UI muestra notificación + actualiza lista                     │
│  3. ACK enviado → backend marca MessageRecipient: received       │
│  4. Cuando usuario abre mensaje → markAsRead → status: read      │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RECEPTOR OFFLINE                           │
│  1. Mensaje queda en DB con status: pending                      │
│  2. Push notification (si móvil) informa al usuario              │
│  3. Al reconectar: GET /messages/pending                          │
│  4. O WebSocket `sync:pending` al handshake                       │
│  5. Batch update de status: pending → received                    │
└─────────────────────────────────────────────────────────────────┘
```

### Estados del Mensaje (por destinatario)

| Status | Cuándo | Quién actualiza |
|--------|---------|-----------------|
| `pending` | Mensaje creado, destinatario offline | Backend al crear |
| `sent` | Mensaje encolado para entrega | Backend post-creación |
| `delivered` | ACK recibido desde cliente | Cliente envía ACK → backend |
| `read` | Usuario abrió el mensaje | Cliente envía `read` evento |

---

## 3. Arquitectura de Sync Mobile (Offline First)

### Capas en Mobile

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI (React Native / Expo)                  │
│              Lee ÚNICAMENTE del store local (SQLite)             │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CachedMessageRepository (mobile infra)          │
│  - Implementa el MISMO puerto que el repository de backend       │
│  - Métodos: list, findById, send, markAsRead, etc.               │
│  - Lee PRIMERO de SQLite, devuelve inmediatamente                 │
│  - En background: sync con RemoteMessageRepository                │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Outbox / Operation Queue                     │
│  - Tabla SQLite: `pending_operations`                             │
│  - Cada write offline genera: op_type, entity_id, payload, ts    │
│  - SyncEngine procesa FIFO cuando hay conexión                   │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SyncEngine (port)                         │
│  - Escucha NetInfo (Expo) para detectar online/offline          │
│  - Al recuperar conexión:                                         │
│    1. Envía pending_operations FIFO al backend                   │
│    2. Pide delta de mensajes nuevos desde last_synced_at         │
│    3. Aplica delta a SQLite local                                 │
│    4. Resuelve conflictos (server-wins por defecto)              │
└─────────────────────────────────────────────────────────────────┘
```

### Tablas SQLite en Mobile

```sql
-- Mensajes (cache local)
messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT,
  subject TEXT,
  body TEXT,
  thread_id TEXT,
  sent_at INTEGER,
  synced INTEGER DEFAULT 1  -- 1 = sincronizado
)

-- Destinatarios/estado
message_recipients (
  id TEXT PRIMARY KEY,
  message_id TEXT,
  recipient_id TEXT,
  status TEXT,
  read_at INTEGER
)

-- Operaciones pendientes (outbox pattern)
pending_operations (
  id TEXT PRIMARY KEY,
  operation_type TEXT,      -- 'send_message', 'mark_read', 'upload_attachment'
  entity_type TEXT,         -- 'message', 'recipient'
  entity_id TEXT,
  payload TEXT,             -- JSON serializado
  created_at INTEGER,
  attempts INTEGER DEFAULT 0
)

-- Estado de sync
sync_state (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_synced_at INTEGER,
  last_synced_message_id TEXT
)
```

### Estrategia de Lectura/Escritura

| Operación | Modo Online | Modo Offline |
|-----------|-------------|--------------|
| **Listar mensajes** | Cache → devuelve + background refresh | Cache → devuelve |
| **Enviar mensaje** | Escribe cache + Envía a API + marca synced | Escribe cache + Encola en pending_operations + marca synced=0 |
| **Marcar leído** | Escribe cache + POST /messages/:id/read + ACK | Escribe cache + Encola |
| **Descargar adjunto** | Si existe en cache local → devuelve; si no → descarga + cachea | Si existe en cache → devuelve; si no → error "sin conexión" |

---

## 4. Estrategia de Adjuntos

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FileStoragePort                            │
│  (definido en application layer, sin conocimiento de S3/disco)   │
│  Métodos: upload(), download(), delete(), getUrl()               │
└──────────────────────────────────┬──────────────────────────────┘
                                   ▼
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │  S3Adapter   │      │ LocalAdapter │      │ MockAdapter  │
    │  (producción)│      │   (dev/local)│      │   (tests)    │
    └──────────────┘      └──────────────┘      └──────────────┘
```

### Flujo de Subida

```
1. Cliente envía: POST /messages con multipart/form-data
   O prefiere:
   POST /attachments/upload → devuelve file_storage_id
   POST /messages { attachments: [file_storage_id_1, ...] }

2. Backend:
   - Valida tamaño máximo (configurable: 50MB por archivo, 100MB total)
   - Valida MIME type (opcional: whitelist)
   - Almacena via FileStoragePort.upload()
   - Guarda Attachment en DB con:
     - file_storage_id (UUID para referencia)
     - original_name
     - mime_type
     - size_bytes

3. URL de acceso:
   - Nunca exponer URL raw de S3
   - Acceder via: GET /attachments/:id/download
   - Controller valida:
     a. AuthN: usuario autenticado
     b. AuthZ: usuario es emisor O destinatario del mensaje
     c. Redirige a signed URL S3 o sirve desde disco

4. Mobile cache:
   - Al descargar adjunto:
     - Guarda en expo-file-system (cache directory)
     - Mapea: attachment_id → local_path en SQLite
     - Próximos accesos van a cache local
```

### Decisiones Clave

| Criterio | Decisión | Justificación |
|-----------|-----------|----------------|
| **Almacenamiento** | S3 (prod) / disco (dev) | Escalable, económico, separado de DB |
| **Tamaño máximo** | 50MB/archivo, 100MB total por mensaje | Balance entre UX y costo |
| **Nombres archivos** | UUID en storage, original_name en DB | Evita colisiones, sanitiza paths |
| **Signed URLs** | Expiran en 15 minutos | Seguridad - no compartir links permanentes |
| **Virus scan** | Opcional - hook pre-upload | Recomendado si usuarios suben ejecutables |

---

## 5. Tiempo Real: WebSocket vs Polling vs Push

### Análisis Comparativo

| Criterio | WebSocket (Socket.IO) | Long Polling | Push Notifications (FCM/APNs) |
|-----------|------------------------|---------------|---------------------------------|
| **Latencia** | Baja (<100ms) | Media (1-5s depende intervalo) | Baja |
| **Uso batería (mobile)** | Alto (conexión mantenida) | Medio | Bajo (optimizado por OS) |
| **Ancho de banda** | Bajo (solo eventos) | Medio (heartbeats) | Bajo |
| **Firewalls/Proxies** | A veces bloquea puerto 443/socket | Funciona siempre (HTTP) | Funciona siempre |
| **Offline delivery** | No - es transporte | No | Sí |
| **Complejidad** | Media | Baja | Alta (tokens, múltiples providers) |

### Recomendación: Estrategia Híbrida

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRANSPORTE EN TIEMPO REAL                  │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
   ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
   │  WebSocket    │      │HTTP Long Poll │      │ Push (FCM/APNs)│
   │ (Socket.IO)   │      │   (fallback)  │      │  (solo alertas)│
   │  Principal    │      │               │      │               │
   └───────┬───────┘      └───────────────┘      └───────────────┘
           │
           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                      RULES OF ENGAGEMENT                          │
   │                                                                   │
   │  1. DB es FUENTE DE VERDAD. WebSocket es SOLO TRANSPORTE.       │
   │     Si WS se cae, no se pierde nada. Al reconectar, sync.       │
   │                                                                   │
   │  2. Mensajes = "entregado" SÓLO cuando cliente envía ACK.       │
   │     No marcar por solo haber enviado por WS.                     │
   │                                                                   │
   │  3. Push = NOTIFICACIÓN solamente. No lleva contenido sensible.  │
   │     "Nuevo mensaje de Juan" → usuario abre app → fetch real.    │
   │                                                                   │
   │  4. Eventos WS:                                                  │
   │     - client: `message:ack` { messageId }                       │
   │     - client: `message:read` { messageId }                      │
   │     - server: `message:new` { message, thread }                 │
   │     - server: `message:status_update` { messageId, status }     │
   │     - server: `thread:update` { threadId, lastMessageAt }       │
   │                                                                   │
   └─────────────────────────────────────────────────────────────────┘
```

### Socket.IO en NestJS

```typescript
// Estructura propuesta:

// Gateways (presentation layer - thin)
@WebSocketGateway()
export class MessagingGateway {
  // Solo: parsea evento → llama use case → envía respuesta
  @SubscribeMessage('message:send')
  async handleSend(@ConnectedSocket() client, @MessageBody() data) {
    const result = await this.sendUseCase.execute({ userId: client.data.userId, ...data })
    // No emitir a otros desde acá - usar domain events
    return result
  }
}

// Event Handler (infrastructure - reacts to domain events)
export class MessageSentWsHandler {
  // Cuando MessageSentEvent se emite:
  // 1. Busca connections de cada destinatario via ConnectionManager
  // 2. Envía `message:new` por cada socket conectado
  // 3. No falla si no hay conexiones - es opcional
}
```

---

## 6. Hilos de Conversación

### Enfoques Comparados

| Enfoque | Pros | Cons |
|---------|------|------|
| **A. Thread con parent_message_id** | Simple, cualquier mensaje puede responder a cualquiera | Difícil reconstruir árbol profundo |
| **B. Materialized Path (path: '1.2.5')** | Fácil traer subárbol entero con `LIKE '1.%'` | Actualizaciones costosas si se mueven ramas |
| **C. Nested Set (lft/rgt)** | Consultas de subárbol muy rápidas | Muy complejo, escritos bloqueantes |
| **D. Flat thread + reply_to** | Un hilo = lista lineal. Respuestas siempre al final del hilo. | Sin estructura de árbol, solo lista encadenada |

### Recomendación: Híbrido (D + C minimal)

Para mensajería empresarial **NO se necesita árbol profundo**. La mayoría de los usuarios prefieren lista ordenada cronológicamente con indicador visual "responde a X".

```
Modelo:

conversation_threads:
  - id
  - subject: string (opcional - tomado del primer mensaje)
  - created_at
  - updated_at
  - message_count

messages:
  - id
  - thread_id: FK a conversation_threads
  - parent_message_id: FK a messages (NULLABLE - el que responde)
  - sender_id
  - subject, body
  - sent_at
```

### Consultas Comunes

```sql
-- Obtener hilos de un usuario con último mensaje
SELECT DISTINCT ON (t.id)
  t.id, t.subject, t.message_count, t.updated_at,
  m.id as last_message_id, m.subject as last_message_subject,
  sender.display_name as last_sender_name
FROM conversation_threads t
JOIN messages m ON m.thread_id = t.id
JOIN users sender ON m.sender_id = sender.id
WHERE EXISTS (
  SELECT 1 FROM message_recipients r
  JOIN messages m2 ON r.message_id = m2.id
  WHERE m2.thread_id = t.id AND r.recipient_id = $1
  UNION
  SELECT 1 FROM messages m3
  WHERE m3.thread_id = t.id AND m3.sender_id = $1
)
ORDER BY t.id, m.sent_at DESC
LIMIT 50 OFFSET 0;

-- Obtener mensajes de un hilo (ordenados)
SELECT
  m.*,
  sender.display_name as sender_name,
  parent.subject as replies_to_subject
FROM messages m
JOIN users sender ON m.sender_id = sender.id
LEFT JOIN messages parent ON m.parent_message_id = parent.id
WHERE m.thread_id = $1
ORDER BY m.sent_at ASC;
```

### Visualización

```
[UI: Hilo de conversación]

> "Reunión mañana 10hs"  (Juan, 10:30)
   ↳ "Confirmo. Traer docs?"  (María, 10:32)  [responde a Juan]
      ↳ "Sí, el presupuesto"  (Juan, 10:33)  [responde a María]
   ↳ "Yo no puedo a esa hora"  (Pedro, 10:35)  [responde a Juan]
```

---

## 7. Seguridad: Roles y Permisos

### Matriz de Roles

| Acción | Admin | Supervisor | Técnico | Usuario |
|--------|-------|------------|---------|---------|
| **Ver mensajes propios** | ✅ | ✅ | ✅ | ✅ |
| **Enviar mensajes** | ✅ | ✅ | ✅ | ✅ |
| **Responder mensajes** | ✅ | ✅ | ✅ | ✅ |
| **Ver mensajes de su equipo** | ✅ | ✅ (solo su grupo) | ❌ | ❌ |
| **Eliminar mensajes** | ✅ (cualquiera) | ✅ (solo enviados por él/equipo) | ❌ | ❌ |
| **Gestionar usuarios** | ✅ | ❌ | ❌ | ❌ |
| **Ver auditoría** | ✅ | ❌ | ❌ | ❌ |

### Implementación

```typescript
// Domain layer: Role VO + Permission logic
export enum Role {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  TECNICO = 'tecnico',
  USUARIO = 'usuario',
}

export class UserIdentity {
  constructor(
    public readonly userId: UserId,
    public readonly role: Role,
    public readonly teamId?: TeamId,  // Si jerarquía por equipos
  ) {}

  canViewMessage(message: Message): boolean {
    // Admin ve TODO
    if (this.role === Role.ADMIN) return true
    
    // Es emisor?
    if (message.senderId.equals(this.userId)) return true
    
    // Es destinatario?
    if (message.recipients.some(r => r.userId.equals(this.userId))) return true
    
    // Supervisor: puede ver mensajes de su equipo?
    if (this.role === Role.SUPERVISOR && this.teamId) {
      // Lógica: si el emisor/destinatario pertenece a su equipo
    }
    
    return false
  }

  canSendTo(recipientIds: UserId[]): boolean {
    // Admin puede enviar a cualquiera
    if (this.role === Role.ADMIN) return true
    
    // Usuarios normales solo pueden enviar a sus contactos
    // → Validar en use case que todos los destinatarios están en su lista
  }
}
```

### Autorización en Use Cases

```typescript
// Application layer: el use case chequea permisos ANTES de ejecutar
export class ViewMessageUseCase {
  constructor(
    private readonly messagesRepo: MessagesRepository,
  ) {}

  async execute(dto: { currentUser: UserIdentity; messageId: MessageId }): Promise<Result<Message, Error>> {
    const message = await this.messagesRepo.findById(dto.messageId)
    if (!message) return Result.err(new MessageNotFound())
    
    // 👉 AuthZ CHECK - ANTES de devolver
    if (!dto.currentUser.canViewMessage(message)) {
      return Result.err(new NotAuthorized())
    }
    
    return Result.ok(message)
  }
}
```

### Cifrado (Recomendación)

| Nivel | Requisito | Implementación |
|-------|-----------|----------------|
| **Transport Layer** | Obligatorio | HTTPS/WSS siempre. NUNCA HTTP en prod. |
| **Auth Tokens** | Obligatorio | JWT short-lived (15min) + httpOnly secure cookies. NO localStorage. Refresh token rotating. |
| **Passwords** | Obligatorio | Argon2id o bcrypt. Nunca texto plano. Nunca MD5/SHA1. |
| **Contenido mensajes** | Opcional (empresarial) | **No** E2EE (complica search/filter). Cifrado en reposo: PostgreSQL pgcrypto o storage S3 server-side encryption. |
| **Adjuntos** | Opcional | S3 server-side encryption (SSE-S3 o SSE-KMS). |
| **Device tokens** | Obligatorio | Almacenar encriptados en DB (no plaintext). |

---

## 8. Entregas Incrementales (SDD Strategy)

### Roadmap de 4 Entregas

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTREGA 1: Core Messaging (Mínimo Viable)     │
└─────────────────────────────────────────────────────────────────┘
Scopo:
✅ Inicializar monorepo (Turborepo) + packages/domain
✅ User/Roles + AuthN (JWT login)
✅ Enviar mensaje simple (sin adjuntos, sin hilos, 1 destinatario)
✅ Recibir mensajes (lista básica, sin tiempo real)
✅ Marcar como leído
✅ API REST básica
✅ Tests unitarios domain

Tamaño estimado: ~800-1000 LOC → **1 PR simple**
Riesgo: Bajo
Validación: Usuario puede enviar y recibir mensajes de texto


┌─────────────────────────────────────────────────────────────────┐
│                    ENTREGA 2: Destinatarios Múltiples + Adjuntos │
└─────────────────────────────────────────────────────────────────┘
Scopo:
✅ MessageRecipients (N destinatarios por mensaje)
✅ Tracking de estado por destinatario (enviado/recibido/leído)
✅ FileStoragePort + Local/S3 adapters
✅ Subir/download adjuntos
✅ Filtros básicos: leídos/no leídos
✅ AuthZ por mensaje (quién puede ver qué)

Tamaño estimado: ~1000 LOC → **1 PR o 2 pequeños**
Riesgo: Medio (adjuntos = superficie de ataque)


┌─────────────────────────────────────────────────────────────────┐
│                    ENTREGA 3: Tiempo Real + Hilos + Búsqueda     │
└─────────────────────────────────────────────────────────────────┘
Scopo:
✅ WebSocket (Socket.IO) + mensajería en tiempo real
✅ ACKs + actualización de estados en vivo
✅ ConversationThread + respuestas (parent_message_id)
✅ Filtros avanzados: fecha, emisor/destinatario
✅ Búsqueda por asunto/contenido (DB LIKE primero → después PG Full Text)
✅ Mobile: estructura de proyecto Expo + Tamagui

Tamaño estimado: ~1200-1500 LOC → **Considerar chained PRs**
Riesgo: Alto (WS edge cases, desconexiones, reconnection)


┌─────────────────────────────────────────────────────────────────┐
│                    ENTREGA 4: Mobile Offline + Sync              │
└─────────────────────────────────────────────────────────────────┘
Scopo:
✅ Mobile SQLite (expo-sqlite)
✅ Repository adapter: CachedMessageRepository
✅ Outbox pattern para writes offline
✅ SyncEngine + detección de conexión
✅ Push notifications (FCM)
✅ UI mobile básica (mensajes, enviar)

Tamaño estimado: ~1500 LOC → **Chained PRs recomendado**
Riesgo: Alto (sync edge cases, conflict resolution)
```

### Orden de Tareas Dentro de Cada Entrega

Para cada entrega, seguir este orden:
1. **Domain**: Crear VOs, Entidades, Events, Repository interfaces
2. **Application**: Crear Use Cases, DTOs, Ports
3. **Infrastructure**: Implementar Repositories, Adapters, Event Handlers
4. **API/Presentation**: Controllers REST, WebSocket Gateways, DTO validation
5. **Tests**: Unit (domain/app), Integration (infra/DB)

---

## Resumen de Hallazgos

### ✅ Hallazgos Clave
1. **Greenfield puro**: Sin código legacy, podemos aplicar Clean Architecture estricto desde el principio
2. **Sync mobile = complejidad real**: No trivial. Requiere outbox pattern, sync engine, resolución de conflictos
3. **DB = fuente de verdad**: WebSocket es solo transporte. Nunca confiar en estado de conexión para tracking de mensajes
4. **Roles necesitan jerarquía**: Admin > Supervisor > Técnico/Usuario. TeamId necesario para "ver mensajes de mi equipo"

### ⚠️ Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| WS reconnection + mensajes perdidos | Media | Alto | Sync completo al handshake. ACK obligatorio. |
| Adjuntos malware/grandes | Media | Medio | Validar tamaño, MIME whitelist opcional, rate limit upload. |
| Mobile sync conflicts | Media | Medio | Server-wins por defecto. Timestamp-based. UI "actualizado por otro usuario". |
| AuthZ bugs - usuario ve mensaje ajeno | Baja | Crítico | Tests de integración por rol. Policy tests. |
| Performance: búsqueda full text | Media | Medio | Empezar con DB LIKE, migrar a PG Full Text Search cuando escale. |

### 📋 Recomendación para Propuesta

**Sí, listo para fase de propuesta.**

Sugerencia: Empezar con **Entrega 1 (Core Messaging)** como primer cambio SDD. Valida la arquitectura básica, el monorepo setup, y permite refinar prioridades antes de agregar complejidad (WS, mobile offline).

Lo que la propuesta debe definir:
1. Nombre del cambio: `mensajeria-core-v1`
2. Scope exacto de Entrega 1
3. Archivos que se crearán
4. Criterios de aceptación (tests incluidos)
5. Plan de rollback
