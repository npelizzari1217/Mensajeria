---
title: "mobile-app Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: mobile-app
status: draft
---

# Mobile App — Specification

## Purpose

Aplicación mobile (React Native / Expo) que consume la API existente y comparte el paquete `@mensajeria/domain`. Cubre las pantallas esenciales para usar Mensajería desde el teléfono.

## Stack

- Framework: Expo (React Native)
- HTTP: Axios (misma config que web)
- WS: socket.io-client
- Navegación: React Navigation (stack + tabs)
- Auth: JWT almacenado en SecureStore
- Comparte: `@mensajeria/domain` desde el monorepo

## Screens

### S1: Auth
- Login screen (email + password)
- Register screen (name + email + password)
- Token almacenado en SecureStore, refresh automático

### S2: Inbox
- Lista de mensajes recibidos con senderName, subject, sentAt, status
- Pull-to-refresh
- Tap → detail screen
- Badge de no leídos

### S3: Sent
- Lista de mensajes enviados con recipients, subject, sentAt

### S4: Message Detail
- Sender info, subject, body, sentAt
- Lista de recipients con status
- Attachments: lista con download
- Botón Reply, Forward, Pin

### S5: Compose
- Para: input de usuario (búsqueda por nombre) o selección de grupo
- Subject, Body (multiline)
- Botón Send
- Botón Save Draft

### S6: Thread
- History del thread ordenado por fecha
- Cada mensaje con sender, body, timestamp

### S7: Search
- Input de búsqueda + resultados paginados
- Misma API que web (`GET /v1/messages/search`)

### S8: Groups
- Lista de grupos propios
- Crear grupo (Admin/Supervisor)
- Ver miembros

### S9: Pinned
- Lista de mensajes pinneados

### S10: Drafts
- Lista de borradores
- Tap para editar
- Enviar o descartar

## Technical Decisions

| Decisión | Opción |
|----------|--------|
| Secure store | expo-secure-store |
| Navegación | React Navigation (Bottom Tabs + Native Stack) |
| HTTP | Axios con interceptor de token |
| WS | socket.io-client (misma lib que web) |
| Domain package | `@mensajeria/domain` workspace reference |
| Over-the-air updates | EAS Update (futuro, no v1) |

## Out of Scope v1
- Modo offline completo
- Notificaciones push (ver push-notifications spec)
- Widgets
- Modo oscuro
