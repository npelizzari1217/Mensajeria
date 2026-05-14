# Tasks: entrega-4-final

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2500–3200 (additions + deletions across 8 PRs) |
| 400-line budget risk | High (every PR except PR1 exceeds 400) |
| Chained PRs recommended | Yes |
| Suggested split | 8 stacked PRs: Fixes → Groups → Drafts → Forward → Pinned → Export → Mobile → Push |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Work Unit Overview

| PR | Goal | Base | Est. Lines | Domain | API | Web | Mobile | Tests |
|----|------|------|-----------|--------|-----|-----|--------|-------|
| 1 | Fixes técnicos | main | ~80 | 0 | 3 files | 0 | 0 | verify existing |
| 2 | Groups | main | ~450 | 8 new | 15+ new | 2 new | 0 | 20+ new |
| 3 | Drafts | main | ~350 | 3 new | 10+ new | 2 new | 0 | 12+ new |
| 4 | Forward | main | ~150 | 1 new | 2 mod | 0 | 0 | 5+ new |
| 5 | Pinned | main | ~200 | 0 | 8 new | 2 new | 0 | 5+ new |
| 6 | Export | main | ~120 | 0 | 2 new | 0 | 0 | 3+ new |
| 7 | Mobile | main | ~1200 | 0 | 0 | 0 | 25+ new | manual |
| 8 | Push | main | ~350 | 0 | 8 new | 0 | 2 mod | 5+ new |

---

## PR 1: Fixes Técnicos

- [ ] 1.1 Fix `get-thread.use-case.ts` — usar `msg.getSenderName()` y `r.getRecipientName()`, eliminar N+1 `userRepo.findById`
- [ ] 1.2 Fix `get-message.use-case.ts` — usar `msg.getSenderName()` y `r.getRecipientName()`, eliminar N+1 `userRepo.findById`
- [ ] 1.3 Fix `reply-to-message.use-case.ts` — eliminar `void event` dead code o wire `EventBus.publish(event)`
- [ ] 1.4 Fix `turbo.json` — renombrar `pipeline` → `tasks`
- [ ] 1.5 Verify: 248+ tests pasan, build OK

## PR 2: Groups

### Domain

- [ ] 2.1 Crear `GroupRole` VO en `packages/domain/src/messaging/value-objects/group-role.ts`
- [ ] 2.2 Crear `Group` entity en `packages/domain/src/messaging/entities/group.ts`
- [ ] 2.3 Crear `GroupMember` entity en `packages/domain/src/messaging/entities/group-member.ts`
- [ ] 2.4 Crear `GroupRepository` port en `packages/domain/src/messaging/repositories/group-repository.ts`
- [ ] 2.5 Crear domain errors: `GroupNotFoundError`, `NotGroupMemberError`, `NotGroupAdminError`
- [ ] 2.6 Crear domain events: `GroupCreated`, `GroupMemberAdded`, `GroupMemberRemoved`
- [ ] 2.7 Exportar nuevos tipos desde `packages/domain/src/index.ts`
- [ ] 2.8 Tests unitarios de dominio: Group.create, addMember, removeMember, isAdmin, isMember (8+ tests)

### Infrastructure

- [ ] 2.9 Agregar modelos `Group` + `GroupMember` + `GroupRole` enum a `api/prisma/schema.prisma`
- [ ] 2.10 Crear migración Prisma
- [ ] 2.11 Crear `PrismaGroupRepository` en `api/src/infrastructure/persistence/prisma/repositories/`
- [ ] 2.12 Crear `GroupMapper` en `api/src/infrastructure/persistence/prisma/mappers/`

### Application

- [ ] 2.13 Crear DTOs: `CreateGroupDTO`, `UpdateGroupDTO`, `GroupResponse`, `GroupMemberResponse`
- [ ] 2.14 Crear `CreateGroupUseCase` — validar role Admin/Supervisor, crear grupo + agregar creator como Admin
- [ ] 2.15 Crear `UpdateGroupUseCase` — validar GroupAdmin
- [ ] 2.16 Crear `DeactivateGroupUseCase` — soft delete
- [ ] 2.17 Crear `AddGroupMemberUseCase` — validar GroupAdmin
- [ ] 2.18 Crear `RemoveGroupMemberUseCase` — validar GroupAdmin
- [ ] 2.19 Crear `ChangeGroupMemberRoleUseCase` — validar GroupAdmin
- [ ] 2.20 Crear `ListUserGroupsUseCase` — grupos donde user es miembro
- [ ] 2.21 Crear `GetGroupDetailUseCase` — grupo + miembros
- [ ] 2.22 Crear `ResolveGroupRecipientsUseCase` — miembros activos dado groupId
- [ ] 2.23 Modificar `SendMessageUseCase` — aceptar `groupId` opcional, resolver recipients del grupo
- [ ] 2.24 Tests: 9 use cases con mocks (12+ tests)

### Presentation

- [ ] 2.25 Crear `GroupsController` con 8 endpoints REST
- [ ] 2.26 Crear `GroupsModule` y registrar en `AppModule`
- [ ] 2.27 Tests de controller con mocks (5+ tests)

### Web

- [ ] 2.28 Crear `web/src/pages/groups/index.page.tsx` — lista de grupos + crear grupo
- [ ] 2.29 Crear `web/src/pages/groups/[id].page.tsx` — detalle + miembros
- [ ] 2.30 Agregar ruta `/groups` en `App.tsx` + link en layout
- [ ] 2.31 Modificar `ComposePage` — selector de grupo (modal/dropdown con grupos del user)

## PR 3: Drafts

### Domain

- [ ] 3.1 Crear `Draft` entity en `packages/domain/src/messaging/entities/draft.ts`
- [ ] 3.2 Crear `DraftRepository` port en `packages/domain/src/messaging/repositories/draft-repository.ts`
- [ ] 3.3 Crear `DraftNotFoundError`
- [ ] 3.4 Exportar desde `packages/domain/src/index.ts`
- [ ] 3.5 Tests: Draft.create, update, send validation (5+ tests)

### Infrastructure

- [ ] 3.6 Agregar modelo `Draft` a `api/prisma/schema.prisma`
- [ ] 3.7 Crear migración Prisma
- [ ] 3.8 Crear `PrismaDraftRepository`
- [ ] 3.9 Crear `DraftMapper`

### Application

- [ ] 3.10 Crear DTOs: `SaveDraftDTO`, `UpdateDraftDTO`, `DraftResponse`
- [ ] 3.11 Crear `SaveDraftUseCase`
- [ ] 3.12 Crear `UpdateDraftUseCase`
- [ ] 3.13 Crear `ListDraftsUseCase`
- [ ] 3.14 Crear `GetDraftUseCase`
- [ ] 3.15 Crear `SendDraftUseCase` — crea Message, publica evento, borra Draft
- [ ] 3.16 Crear `DeleteDraftUseCase`
- [ ] 3.17 Tests: 6 use cases con mocks (8+ tests)

### Presentation

- [ ] 3.18 Crear `DraftsController` con 6 endpoints
- [ ] 3.19 Crear `DraftsModule` y registrar en `AppModule`
- [ ] 3.20 Tests de controller (4+ tests)

### Web

- [ ] 3.21 Crear `web/src/pages/drafts/index.page.tsx` — lista de drafts
- [ ] 3.22 Crear `web/src/pages/drafts/[id].page.tsx` — editar draft
- [ ] 3.23 Agregar ruta `/drafts` en App.tsx + link en layout
- [ ] 3.24 Modificar `ComposePage` — botón "Guardar borrador" que llama a POST /v1/drafts

## PR 4: Forward

- [ ] 4.1 Crear `ForwardedContent` VO en `packages/domain/src/messaging/value-objects/forwarded-content.ts`
- [ ] 4.2 Exportar desde `packages/domain/src/index.ts`
- [ ] 4.3 Crear `ForwardMessageDTO` — recipientIds[], groupId?, comment?
- [ ] 4.4 Crear `ForwardMessageUseCase` — verificar acceso, copiar con quote, crear nuevo Message, publicar evento
- [ ] 4.5 Extender `MessagingController` con `POST /v1/messages/:id/forward`
- [ ] 4.6 Tests: forward como sender, como recipient, sin acceso, con comment (5+ tests)

## PR 5: Pinned Messages

- [ ] 5.1 Agregar modelo `UserPinnedMessage` a `api/prisma/schema.prisma`
- [ ] 5.2 Crear migración Prisma
- [ ] 5.3 Crear `PinMessageUseCase` — verificar acceso al mensaje, crear UserPinnedMessage
- [ ] 5.4 Crear `UnpinMessageUseCase` — eliminar UserPinnedMessage
- [ ] 5.5 Crear `ListPinnedMessagesUseCase` — mensajes del usuario con pinnedAt
- [ ] 5.6 Crear `PinnedController` con 3 endpoints
- [ ] 5.7 Crear `PinnedModule` y registrar
- [ ] 5.8 Tests: pin, unpin, list, pin duplicado (4+ tests)
- [ ] 5.9 Crear `web/src/pages/pinned.page.tsx`
- [ ] 5.10 Agregar ruta + link en layout
- [ ] 5.11 Agregar botón pin/unpin en `DetailPage`

## PR 6: Export

- [ ] 6.1 Crear `ExportThreadUseCase` — verifica acceso, obtiene thread, serializa JSON
- [ ] 6.2 Extender `MessagingController` con `GET /v1/messages/:id/thread/export?format=json`
- [ ] 6.3 Tests: export JSON, export sin acceso (3+ tests)

## PR 7: Mobile App (Expo)

### Setup

- [ ] 7.1 Crear `mobile/package.json` con dependencias: expo, axios, socket.io-client, react-navigation, expo-secure-store
- [ ] 7.2 Agregar workspace `mobile` a `pnpm-workspace.yaml` y raíz `turbo.json`
- [ ] 7.3 Crear `mobile/tsconfig.json`, `mobile/app.json`, `mobile/App.tsx`
- [ ] 7.4 Configurar `@mensajeria/domain` como dependencia workspace

### Core Infrastructure

- [ ] 7.5 Crear `mobile/src/api/client.ts` — Axios instance con interceptor JWT + refresh
- [ ] 7.6 Crear `mobile/src/contexts/auth.context.tsx` — login, register, logout, token management con SecureStore
- [ ] 7.7 Crear `mobile/src/contexts/socket.context.tsx` — Socket.IO connection con JWT auth

### Screens

- [ ] 7.8 Crear `mobile/src/screens/login.screen.tsx`
- [ ] 7.9 Crear `mobile/src/screens/register.screen.tsx`
- [ ] 7.10 Crear `mobile/src/screens/inbox.screen.tsx` — FlatList, pull-to-refresh, WS listener, badge
- [ ] 7.11 Crear `mobile/src/screens/sent.screen.tsx`
- [ ] 7.12 Crear `mobile/src/screens/detail.screen.tsx` — mensaje completo, attachments, reply/forward/pin buttons
- [ ] 7.13 Crear `mobile/src/screens/compose.screen.tsx` — recipient selector, subject, body, send + save draft
- [ ] 7.14 Crear `mobile/src/screens/thread.screen.tsx`
- [ ] 7.15 Crear `mobile/src/screens/search.screen.tsx`
- [ ] 7.16 Crear `mobile/src/screens/groups.screen.tsx` + create group
- [ ] 7.17 Crear `mobile/src/screens/drafts.screen.tsx`
- [ ] 7.18 Crear `mobile/src/screens/pinned.screen.tsx`

### Navigation

- [ ] 7.19 Crear `mobile/src/navigation/app.navigator.tsx` — Bottom tabs + Stack navigators
- [ ] 7.20 Configurar Deep link para notificaciones push

### Components

- [ ] 7.21 Crear `mobile/src/components/message-card.tsx`
- [ ] 7.22 Crear `mobile/src/components/recipient-selector.tsx`
- [ ] 7.23 Crear `mobile/src/components/attachment-list.tsx`

## PR 8: Push Notifications

### Setup

- [ ] 8.1 Instalar `firebase-admin` en api
- [ ] 8.2 Crear `FirebasePushSender` — service account, enviar a token único o múltiple

### Infrastructure

- [ ] 8.3 Agregar modelo `DeviceToken` a `api/prisma/schema.prisma`
- [ ] 8.4 Crear migración Prisma
- [ ] 8.5 Crear `RegisterDeviceTokenUseCase`
- [ ] 8.6 Crear `RemoveDeviceTokenUseCase`
- [ ] 8.7 Crear `DevicesController` con 3 endpoints
- [ ] 8.8 Crear `NotificationsModule` y registrar en AppModule

### EventBus Handler

- [ ] 8.9 Crear `PushNotificationHandler` — en `MessageSent`, verificar si recipient está offline (no tiene WS room activa), si sí → enviar push FCM a sus DeviceTokens
- [ ] 8.10 Suscribir handler en EventBusModule
- [ ] 8.11 Feature toggle `PUSH_ENABLED` env var

### Mobile

- [ ] 8.12 Instalar `expo-notifications` en mobile
- [ ] 8.13 En login/logout: register/remove device token via API
- [ ] 8.14 Manejar notificación recibida: si app foreground → no mostrar (WS ya maneja), si background → al tocar navegar a detail screen

### Tests

- [ ] 8.15 Tests unitarios: handler skip si conectado, handler envía push offline, error FCM no propaga (5+ tests)
