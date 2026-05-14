---
title: "groups Specification"
change: entrega-4-final
phase: spec
artifact: spec
capability: groups
status: draft
---

# Groups — Specification

## Purpose

Usuarios con rol Admin/Supervisor pueden crear grupos (equipos/departamentos). Los mensajes pueden enviarse a un grupo, resolviéndose a todos sus miembros activos. Evita escribir UUIDs manualmente.

## Modelo

- **Group**: id, name, description, createdBy (UserId), createdAt, updatedAt, isActive
- **GroupMember**: groupId, userId, role (Admin/Member), joinedAt
- **Message**: extender con `groupId: string | null`

## Requirements

### R1: CRUD Grupos

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Crear grupo | Admin/Supervisor auth | POST /v1/groups { name, description } | 201, group creado, creador es GroupMember.role=Admin |
| 1.2 | Crear grupo sin permisos | Usuario auth | POST /v1/groups | 403 |
| 1.3 | Listar grupos | Usuario auth | GET /v1/groups | 200, grupos donde es miembro |
| 1.4 | Ver detalle | Miembro del grupo | GET /v1/groups/:id | 200, miembros incluidos |
| 1.5 | Actualizar grupo | GroupAdmin del grupo | PATCH /v1/groups/:id { name } | 200 |
| 1.6 | Desactivar grupo | GroupAdmin | DELETE /v1/groups/:id | 204, isActive=false |

### R2: Miembros

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | Agregar miembro | GroupAdmin | POST /v1/groups/:id/members { userId } | 201, miembro agregado con role=Member |
| 2.2 | Quitar miembro | GroupAdmin | DELETE /v1/groups/:id/members/:userId | 204 |
| 2.3 | Cambiar role miembro | GroupAdmin | PATCH /v1/groups/:id/members/:userId { role } | 200 |
| 2.4 | Salir del grupo | Miembro | DELETE /v1/groups/:id/members/me | 204 |

### R3: Enviar a grupo

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Enviar a grupo | Miembro del grupo | POST /v1/messages { groupId, subject, body } | 201, MessageRecipient creado para cada miembro activo (excluyendo sender) |
| 3.2 | Enviar a grupo inexistente | Auth | POST /v1/messages { groupId: 'fake' } | 404 |
| 3.3 | No miembro intenta enviar | Auth pero no miembro | POST /v1/messages { groupId } | 403 |

### R4: Resolución de recipients

El sistema DEBE resolver `groupId` a `UserId[]` de miembros activos (excluyendo sender) en el momento del envío. Si se agrega un miembro después, NO recibe mensajes anteriores.
