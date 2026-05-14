# Proposal: entrega-4-final

## Intent

Completar la plataforma Mensajería con mobile app React Native, notificaciones push, grupos/departamentos, drafts, forward, pinned messages, exportación, y resolver deuda técnica pendiente. La última entrega que transforma el sistema web en una plataforma mobile-first completa.

## Scope

### In Scope

1. **App Mobile** — Expo + React Native. Inbox, compose, detail, thread, search, attachments, WS real-time. Comparte `@mensajeria/domain`.
2. **Push Notifications** — FCM. API register device token + backend dispatch on `MessageSent`/`MessageRead`.
3. **Grupos (Teams/Departments)** — Domain entity `Group` + `GroupMember`, repositorio, use cases, API endpoints, web UI, mobile UI.
4. **Drafts** — Guardar borrador antes de enviar. Listar, editar, enviar, descartar.
5. **Forward** — Reenviar mensaje con control de acceso. Cita del contenido original.
6. **Pinned Messages** — Marcar/desmarcar mensaje importante. Lista pinned por usuario.
7. **Exportar conversación** — PDF + JSON de un thread.
8. **Fix deuda técnica** — get-thread/get-message N+1, void event en reply-to-message, migrar turbo.json `pipeline` → `tasks`.

### Out of Scope

- OAuth / SSO / 2FA
- Grupos anidados o jerarquía de grupos
- Encuestas, reacciones, typing indicators
- Videollamadas / llamadas de voz
- Modo offline completo en mobile (sync engine diferido)
- Traducción multi-idioma
- Tauri v2 desktop app

## Capabilities

### New Capabilities

- `mobile-app`: Aplicación React Native (Expo) compartiendo dominio con web/api
- `push-notifications`: Notificaciones push vía Firebase Cloud Messaging
- `groups`: Gestión de grupos/equipos con miembros y roles internos
- `drafts`: Borradores de mensajes — guardar antes de enviar
- `forward`: Reenviar mensajes con contenido citado y control de acceso
- `pinned-messages`: Marcar/desmarcar mensajes importantes por usuario
- `data-export`: Exportar conversaciones a PDF y JSON

### Modified Capabilities

- `messaging-core`: Agregar `messageType` (normal|draft) en Message, nuevo use case forward, nuevo status en MessageRecipient
- `real-time-notifications`: Extender EventBus handlers para enviar push notifications cuando el destinatario está offline
- `message-search`: Incluir drafts en search scope (si el user es sender, ver sus drafts)

## Approach

### Estrategia general

8 capacidades → 8 PRs stacked-to-main, en orden de dependencias:

```
PR1 Fixes técnicos ─→ PR2 Groups ─→ PR3 Drafts ─→ PR4 Forward ─→ PR5 Pinned ─→ PR6 Export ─→ PR7 Mobile ─→ PR8 Push
```

Cada PR es autónomo, mergea a main. PR7 (Mobile) y PR8 (Push) son los más grandes y dependen de que los endpoints de API ya estén servidos.

### Decisiones técnicas clave

| Decisión | Opción elegida | Por qué |
|----------|---------------|---------|
| Mobile framework | Expo (React Native) | Compartir `@mensajeria/domain` sin reescribir. JS puro, zero native modules para v1 |
| UI mobile | Sin framework UI pesado — estilo funcional con componentes simples | La app mobile v1 es funcional, no necesita Tamagui/NativeWind |
| Push provider | Firebase Cloud Messaging | Gratuito, cross-platform, maduro |
| Groups model | Nueva entidad `Group` con `GroupMember[]`, Message puede targetar groupId | Escalable, evita resolver grupos en el frontend |
| Drafts | Nuevo `Draft` entity en dominio, `messageType` enum en Message | Separación clara, draft no tiene recipients hasta enviar |
| Forward | Nuevo `ForwardedContent` VO, use case que copia + referencia | Simple, reusa endpoints existentes |
| Pinned | `UserPinnedMessage` join entity en DB | No modifica Message, escalable |
| Export | PDF vía `pdfkit` o `jspdf`, JSON serialización | Server-side, reusa attachment storage |

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `packages/domain/src/` | Major | Nuevas entidades: Group, GroupMember, Draft, UserPinnedMessage, ForwardedContent. Nuevos VOs, repos, eventos |
| `api/prisma/schema.prisma` | Major | 5+ nuevas tablas: Group, GroupMember, DeviceToken, Draft, UserPinnedMessage |
| `api/src/application/` | Major | 15+ nuevos use cases |
| `api/src/presentation/` | Major | 6+ nuevos controllers o extensiones |
| `api/src/infrastructure/` | Medium | Nuevos adaptadores: Prisma repos, FCM push sender |
| `web/src/` | Medium | Nuevas páginas: groups, drafts, pinned, forward, export |
| `mobile/` | New | Proyecto Expo completo |
| `packages/domain/src/index.ts` | Medium | Nuevos exports |
| `turbo.json` | Minor | Migrar `pipeline` → `tasks` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile sin push no tiene sentido | Medium | PR8 (Push) inmediatamente después de PR7 (Mobile) |
| FCM requiere cuenta Firebase configurada | Medium | Documentar setup. API key como env var. Desplegar con flag feature toggle |
| Groups + Drafts + Forward pueden compartir lógica de "buscar recipients" | Low | Diseñar con anticipación: resolver recipients es un paso común |
| Export PDF puede ser complejo | Low | Empezar con JSON export, PDF en segundo release si es necesario |
| turbo.json pipeline→tasks rompe build CI | Low | Incluir en PR1, verificar antes de mergear |

## Rollback Plan

Por PR stacked-to-main: cada PR se revierte individualmente con `git revert <sha>` y se mergea el revert. PR7 (Mobile) y PR8 (Push) agregan código nuevo sin modificar existente, rollback directo.

## Dependencies

- Node >=20, pnpm 9
- Expo CLI (`npx create-expo-app` o agregar a monorepo existente)
- Firebase project + service account para FCM
- (Para PDF) `pdfkit` o `jspdf` npm package

## Success Criteria

- [ ] Mobile app puede listar inbox, ver detalle, componer y enviar mensajes
- [ ] Notificaciones push llegan cuando la app está en background
- [ ] CRUD completo de grupos con miembros
- [ ] Drafts: guardar, listar, editar, enviar
- [ ] Forward: reenviar mensaje con cita del original
- [ ] Pinned: marcar, desmarcar, listar
- [ ] Export: descargar thread como JSON
- [ ] 0 tests rotos (todos los existentes siguen pasando)
- [ ] N+1 eliminado en get-thread y get-message
- [ ] `void event` eliminado en reply-to-message
