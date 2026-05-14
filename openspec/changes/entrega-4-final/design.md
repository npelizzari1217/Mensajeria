# Design: entrega-4-final

## Technical Approach

8 PRs stacked-to-main. Cada PR es autónomo, mergea a main, y agrega una capacidad completa.

```
PR1 (Fixes) → PR2 (Groups) → PR3 (Drafts) → PR4 (Forward) → PR5 (Pinned) → PR6 (Export) → PR7 (Mobile) → PR8 (Push)
```

PR7 y PR8 dependen de que PR1-PR6 hayan expuesto los endpoints REST necesarios.

---

## PR 1: Fixes Técnicos + turbo.json

### Archivos a modificar

| File | Cambio |
|------|--------|
| `api/src/application/messaging/use-cases/get-thread.use-case.ts` | Reemplazar N+1 userRepo.findById con msg.getSenderName() / r.getRecipientName() |
| `api/src/application/messaging/use-cases/get-message.use-case.ts` | Reemplazar N+1 userRepo.findById con msg.getSenderName() / r.getRecipientName() |
| `api/src/application/messaging/use-cases/reply-to-message.use-case.ts` | Eliminar `void event` o wire EventBus.publish() |
| `turbo.json` | Renombrar `pipeline` → `tasks` |

Los 3 use cases ya existen y tienen tests. El cambio es mecánico: usar los transient getters que ya están en Message entity y fueron poblados por el mapper en tech-debt-must-fix.

---

## PR 2: Groups

### Domain

```
packages/domain/src/messaging/
├── entities/
│   ├── group.ts          — Group entity
│   └── group-member.ts   — GroupMember entity
├── repositories/
│   └── group-repository.ts  — GroupRepository port
├── events/
│   ├── group-created.ts
│   └── group-member-added.ts
├── value-objects/
│   └── group-role.ts     — GroupRole VO (Admin, Member)
└── errors/
    └── group.errors.ts
```

- **Group**: id, name, description, createdBy (UserId), createdAt, updatedAt, isActive
- **GroupMember**: groupId, userId, role (GroupRole), joinedAt
- **GroupRepository**: save, findById, findAll, findByUser, update, delete (soft)
- Message entity NO se modifica — `groupId` se pasa como parámetro en el use case

### Prisma Schema

```prisma
model Group {
  id          String   @id @default(uuid()) @map("group_id")
  name        String
  description String?
  createdBy   String   @map("created_by")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("groups")
}

model GroupMember {
  id        String   @id @default(uuid())
  groupId   String   @map("group_id")
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      GroupRole @default(MEMBER)
  joinedAt  DateTime @default(now()) @map("joined_at")
  @@unique([groupId, userId])
  @@map("group_members")
}

enum GroupRole { ADMIN MEMBER }
```

### Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| CreateGroupUseCase | name, description, userId | Group |
| UpdateGroupUseCase | groupId, name, description, userId | Group |
| DeactivateGroupUseCase | groupId, userId | void |
| AddGroupMemberUseCase | groupId, userId, requesterId | GroupMember |
| RemoveGroupMemberUseCase | groupId, userId, requesterId | void |
| ChangeGroupMemberRoleUseCase | groupId, userId, role, requesterId | GroupMember |
| ListUserGroupsUseCase | userId | Group[] |
| GetGroupDetailUseCase | groupId, userId | Group + GroupMember[] |
| GetGroupMembersUseCase | groupId, userId | GroupMember[] |
| ResolveGroupRecipientsUseCase | groupId | UserId[] (usado por send-message) |

### Send to Group

Se modifica `SendMessageUseCase` para aceptar `groupId` opcional. Si se provee:
1. `ResolveGroupRecipientsUseCase` resuelve miembros activos (excluye sender)
2. Esos UserId se pasan como recipientIds
3. El mensaje se marca con groupId en metadata

### API Endpoints

```
POST   /v1/groups                      → CreateGroup
GET    /v1/groups                      → ListUserGroups
GET    /v1/groups/:id                  → GetGroupDetail
PATCH  /v1/groups/:id                  → UpdateGroup
DELETE /v1/groups/:id                  → DeactivateGroup
POST   /v1/groups/:id/members          → AddGroupMember
DELETE /v1/groups/:id/members/:userId  → RemoveGroupMember
PATCH  /v1/groups/:id/members/:userId  → ChangeGroupMemberRole
```

Todos protegidos con AuthGuard. Roles internos del grupo (no confundir con roles de User).

### Web UI

- Página `/groups` — lista de grupos, crear grupo
- Página `/groups/:id` — detalle + miembros + acciones
- Modal en ComposePage para seleccionar grupo en vez de escribir UUIDs

---

## PR 3: Drafts

### Domain

```
packages/domain/src/messaging/
├── entities/
│   └── draft.ts             — Draft entity
├── repositories/
│   └── draft-repository.ts  — DraftRepository port
└── errors/
    └── draft.errors.ts
```

**Draft entity**: id, senderId, subject, body, recipientIds (UserId[]), groupId?, parentMessageId?, createdAt, updatedAt. No usa MessageRecipient — recipients son solo IDs hasta que se envía.

### Prisma Schema

```prisma
model Draft {
  id              String   @id @default(uuid())
  senderId        String   @map("sender_id")
  subject         String
  body            String
  recipientIds    String   @map("recipient_ids")  // JSON array de UUIDs
  groupId         String?  @map("group_id")
  parentMessageId String?  @map("parent_message_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  @@index([senderId])
  @@map("drafts")
}
```

`recipientIds` se almacena como JSON string array (ej: `'["uuid1","uuid2"]'`). Alternativa: tabla DraftRecipient, pero para v1 alcanza con JSON column.

### Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| SaveDraftUseCase | senderId, subject, body, recipientIds?, groupId?, parentMessageId? | Draft |
| UpdateDraftUseCase | draftId, senderId, fields | Draft |
| ListDraftsUseCase | senderId, pagination | Draft[] |
| GetDraftUseCase | draftId, senderId | Draft |
| SendDraftUseCase | draftId, senderId | Message (crea y borra draft) |
| DeleteDraftUseCase | draftId, senderId | void |

### API

```
POST   /v1/drafts                  → SaveDraft
GET    /v1/drafts                  → ListDrafts
GET    /v1/drafts/:id              → GetDraft
PATCH  /v1/drafts/:id              → UpdateDraft
POST   /v1/drafts/:id/send         → SendDraft
DELETE /v1/drafts/:id              → DeleteDraft
```

### Web UI

- Página `/drafts` — lista de borradores
- Cada draft se puede editar (abre compose con datos precargados) o descartar
- ComposePage tiene botón "Guardar borrador" además de "Enviar"

---

## PR 4: Forward

### Domain

```
packages/domain/src/messaging/
├── value-objects/
│   └── forwarded-content.ts  — ForwardedContent VO
```

**ForwardedContent**: originalMessageId, originalSenderName, originalSubject, originalBody, originalSentAt.

El use case `ForwardMessageUseCase`:
1. Verifica acceso al mensaje original (sender o recipient)
2. Crea quote del body original (`> {original body}`)
3. Si hay comment, lo antepone (`{comment}\n\n---\n\n> {original body}`)
4. Crea nuevo Message con `forwardedFrom` metadata y recipients dados
5. Publica `MessageSent` event

### API

```
POST /v1/messages/:id/forward { recipientIds?, groupId?, comment? }
```

Reusa el DTO de compose + `comment` opcional. Response es el nuevo Message.

---

## PR 5: Pinned Messages

### Prisma Schema

```prisma
model UserPinnedMessage {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  messageId String   @map("message_id")
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  pinnedAt  DateTime @default(now()) @map("pinned_at")
  @@unique([userId, messageId])
  @@map("user_pinned_messages")
}
```

### Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| PinMessageUseCase | messageId, userId | void |
| UnpinMessageUseCase | messageId, userId | void |
| ListPinnedMessagesUseCase | userId, pagination | Message[] con pinnedAt |

### API

```
POST   /v1/messages/:id/pin    → PinMessage
DELETE /v1/messages/:id/pin    → UnpinMessage
GET    /v1/messages/pinned     → ListPinned
```

### Web UI

- Icono de pin en inbox/sent/detail si está pinneado
- Botón pin/unpin en detail
- Página `/messages/pinned`

---

## PR 6: Data Export

### Server-side

```
api/src/application/messaging/use-cases/export-thread.use-case.ts
```

- `ExportThreadUseCase`: recibe messageId + userId + format. Verifica acceso. Obtiene thread vía GetThreadUseCase existente. Serializa según formato.
- `formats/json`: `JSON.stringify(threadData, null, 2)`, Content-Type: application/json
- `formats/pdf`: usa `pdfkit` para generar PDF en memoria (Buffer), envía como stream

### API

```
GET /v1/messages/:id/thread/export?format=json|pdf
```

Response es el archivo como descarga. Content-Disposition: attachment.

### Formato JSON

```json
{
  "exportedAt": "2026-05-14T12:00:00Z",
  "exportedBy": { "userId": "...", "name": "..." },
  "thread": [
    {
      "messageId": "...",
      "senderName": "...",
      "subject": "...",
      "body": "...",
      "sentAt": "...",
      "recipients": [ { "userId": "...", "name": "...", "status": "read" } ],
      "attachments": [ { "filename": "...", "mimeType": "...", "size": 1234 } ]
    }
  ]
}
```

---

## PR 7: Mobile App (Expo)

### Setup

```
mobile/
├── app.json
├── package.json          — expo, axios, socket.io-client, react-navigation, expo-secure-store
├── tsconfig.json
├── App.tsx               — Entry point, providers (Auth, Socket, Navigation)
├── src/
│   ├── api/
│   │   ├── client.ts     — Axios instance con interceptor JWT
│   │   └── endpoints/    — inbox, sent, search, groups, drafts, pinned
│   ├── contexts/
│   │   ├── auth.context.tsx
│   │   └── socket.context.tsx
│   ├── screens/
│   │   ├── login.screen.tsx
│   │   ├── register.screen.tsx
│   │   ├── inbox.screen.tsx
│   │   ├── sent.screen.tsx
│   │   ├── detail.screen.tsx
│   │   ├── compose.screen.tsx
│   │   ├── thread.screen.tsx
│   │   ├── search.screen.tsx
│   │   ├── groups.screen.tsx
│   │   ├── drafts.screen.tsx
│   │   └── pinned.screen.tsx
│   ├── components/
│   │   ├── message-card.tsx
│   │   ├── recipient-selector.tsx
│   │   └── attachment-list.tsx
│   └── navigation/
│       └── app.navigator.tsx
```

### Auth Flow
1. Login → POST /auth/login → store access_token + refresh_token en SecureStore
2. Cada request: Axios interceptor agrega `Authorization: Bearer {token}`
3. Si 401 → intenta refresh → si falla → logout → login screen
4. SecureStore: `expo-secure-store` para tokens

### WebSocket
- SocketContext igual al de web: connect a `{API_URL}/messages` con token en handshake
- Listen `message:new` → actualiza inbox o muestra toast

### Dependencias principales
- `expo`, `expo-router` o React Navigation
- `axios`, `socket.io-client`, `expo-secure-store`, `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`

---

## PR 8: Push Notifications (FCM)

### Backend

```
api/src/
├── application/notifications/
│   ├── use-cases/
│   │   ├── register-device-token.use-case.ts
│   │   └── remove-device-token.use-case.ts
│   └── dtos/
│       └── device-token.dto.ts
├── infrastructure/notifications/
│   ├── firebase-push-sender.ts     — Firebase Admin SDK
│   ├── handlers/
│   │   └── push-notification-handler.ts  — EventHandler para offline push
│   └── notifications.module.ts
└── presentation/
    └── devices.controller.ts
```

### FCM Handler Flow

```
MessageSent published
  → PushNotificationHandler.handle(event)
    → Check if recipient has active WS connection (via Gateway rooms)
      → YES: skip (WS handles it)
      → NO: query DeviceToken records for recipient
        → For each token: send via Firebase Admin SDK
        → Log success/failure (never throw)
```

### API Endpoints

```
POST   /v1/devices          { token, platform } → RegisterDeviceToken
DELETE /v1/devices/:token                        → RemoveDeviceToken
DELETE /v1/devices                               → RemoveAllUserTokens (on logout)
```

### Prisma Schema

```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String
  platform  String   @default("ios")  // "ios" | "android"
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@unique([userId, token])
  @@index([token])
  @@map("device_tokens")
}
```

### Firebase Setup Required (documentación)

1. Crear proyecto Firebase
2. Service account → descargar JSON → `FCM_SERVICE_ACCOUNT_PATH` env var
3. Instalar `firebase-admin` npm package
4. En mobile: `expo-notifications` para recibir pushes y obtener token

### Feature Toggle

```env
PUSH_ENABLED=true
FCM_SERVICE_ACCOUNT_PATH=/path/to/service-account.json
```

Si `PUSH_ENABLED=false`, el handler se saltea sin error.

---

## Testing Strategy

| PR | Tests requeridos |
|----|-----------------|
| PR1 | Tests existentes deben seguir pasando (248). Verificar que get-thread/get-message no hacen N+1 |
| PR2 | 6+ unit tests x use case. Tests de integración para GroupRepository. Tests de controller |
| PR3 | 6+ unit tests. Tests de SendDraft (crea message, borra draft) |
| PR4 | 4+ unit tests: forward como sender, forward como recipient, forward sin acceso, forward con comment |
| PR5 | 3+ unit tests: pin, unpin, list, pin duplicado |
| PR6 | 2+ tests: export JSON, export sin acceso |
| PR7 | Smoke tests manuales (no hay setup mobile CI v1) |
| PR8 | Unit test: handler skip si recipient conectado. Unit test: handler envía push offline. Mock FCM |

---

## Estado de Archivos

### PR1 — Fixes (4 files changed)
- `api/src/application/messaging/use-cases/get-thread.use-case.ts` — mod
- `api/src/application/messaging/use-cases/get-message.use-case.ts` — mod
- `api/src/application/messaging/use-cases/reply-to-message.use-case.ts` — mod
- `turbo.json` — mod

### PR2 — Groups (30+ files)
- `packages/domain/src/messaging/entities/group.ts` — new
- `packages/domain/src/messaging/entities/group-member.ts` — new
- `packages/domain/src/messaging/repositories/group-repository.ts` — new
- `packages/domain/src/messaging/value-objects/group-role.ts` — new
- `packages/domain/src/messaging/events/group-created.ts` — new
- `packages/domain/src/messaging/errors/group.errors.ts` — new
- `packages/domain/src/index.ts` — mod
- `api/prisma/schema.prisma` — mod (+ migration)
- `api/src/application/groups/use-cases/*` — 9 files new
- `api/src/application/groups/dtos/*` — 2 files new
- `api/src/infrastructure/persistence/prisma/repositories/prisma-group.repository.ts` — new
- `api/src/infrastructure/persistence/prisma/mappers/group-mapper.ts` — new
- `api/src/presentation/groups/groups.controller.ts` — new
- `api/src/presentation/groups/groups.module.ts` — new
- `api/src/app.module.ts` — mod
- `api/src/application/messaging/use-cases/send-message.use-case.ts` — mod
- `web/src/pages/groups/` — 2 pages new
- `web/src/App.tsx` — mod
- `web/src/components/layout.tsx` — mod

### PR3 — Drafts (20+ files)
- `packages/domain/src/messaging/entities/draft.ts` — new
- `packages/domain/src/messaging/repositories/draft-repository.ts` — new
- `packages/domain/src/messaging/errors/draft.errors.ts` — new
- `packages/domain/src/index.ts` — mod
- `api/prisma/schema.prisma` — mod (+ migration)
- `api/src/application/drafts/use-cases/*` — 6 files new
- `api/src/application/drafts/dtos/*` — 2 files new
- `api/src/infrastructure/persistence/prisma/repositories/prisma-draft.repository.ts` — new
- `api/src/infrastructure/persistence/prisma/mappers/draft-mapper.ts` — new
- `api/src/presentation/drafts/drafts.controller.ts` — new
- `api/src/presentation/drafts/drafts.module.ts` — new
- `api/src/app.module.ts` — mod
- `web/src/pages/drafts/` — 2 pages new
- `web/src/pages/compose.page.tsx` — mod (add "Save Draft")
- `web/src/App.tsx` — mod
- `web/src/components/layout.tsx` — mod

### PR4 — Forward (8+ files)
- `packages/domain/src/messaging/value-objects/forwarded-content.ts` — new
- `packages/domain/src/index.ts` — mod
- `api/src/application/messaging/use-cases/forward-message.use-case.ts` — new
- `api/src/application/messaging/dtos/forward-message.dto.ts` — new
- `api/src/presentation/messaging/messaging.controller.ts` — mod

### PR5 — Pinned (15+ files)
- `api/prisma/schema.prisma` — mod (+ migration)
- `api/src/application/pinned/use-cases/*` — 3 files new
- `api/src/infrastructure/persistence/prisma/repositories/prisma-pinned.repository.ts` — new
- `api/src/presentation/pinned/pinned.controller.ts` — new
- `api/src/presentation/pinned/pinned.module.ts` — new
- `api/src/app.module.ts` — mod
- `web/src/pages/pinned.page.tsx` — new
- `web/src/pages/detail.page.tsx` — mod (pin button)
- `web/src/App.tsx` — mod
- `web/src/components/layout.tsx` — mod

### PR6 — Export (3+ files)
- `api/src/application/messaging/use-cases/export-thread.use-case.ts` — new
- `api/src/presentation/messaging/messaging.controller.ts` — mod

### PR7 — Mobile (25+ files)
- `mobile/package.json` — new
- `mobile/app.json` — new
- `mobile/tsconfig.json` — new
- `mobile/App.tsx` — new
- `mobile/src/*` — 20+ files new

### PR8 — Push (10+ files)
- `api/prisma/schema.prisma` — mod (+ migration)
- `api/src/application/notifications/use-cases/*` — 2 files new
- `api/src/infrastructure/notifications/firebase-push-sender.ts` — new
- `api/src/infrastructure/notifications/handlers/push-notification-handler.ts` — new
- `api/src/infrastructure/notifications/notifications.module.ts` — new
- `api/src/presentation/devices.controller.ts` — new
- `api/src/app.module.ts` — mod
