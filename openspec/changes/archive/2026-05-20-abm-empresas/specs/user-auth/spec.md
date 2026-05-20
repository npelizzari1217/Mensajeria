---
title: "user-auth delta for abm-empresas"
change: abm-empresas
phase: spec
artifact: spec
capability: user-auth
status: draft
---

# Delta for user-auth

## MODIFIED Requirements

### Requirement: User Registration
El sistema MUST permitir registrar usuarios con email + password + name + role, pero ahora bajo caller context. El endpoint MUST requerir AuthGuard + RolesGuard + `@Roles(Admin, Supervisor)`.

| Regla | Valor |
|-------|-------|
| Email | único, formato válido, case-insensitive |
| Password | mínimo 8 caracteres |
| Role | por defecto: `Usuario`. Admin puede asignar cualquier rol; Supervisor NO puede asignar `Admin`. |
| Empresa | Admin puede indicar cualquier `empresaId`; Supervisor solo la propia empresa |

#### Scenario: Admin registra usuario en cualquier empresa
- GIVEN solicitante Admin, datos válidos y `empresaId` arbitrario
- WHEN POST `/auth/register`
- THEN 201 y usuario creado

#### Scenario: Supervisor registra usuario en su empresa
- GIVEN solicitante Supervisor, datos válidos y `empresaId` igual a su empresa
- WHEN POST `/auth/register`
- THEN 201 y usuario creado

#### Scenario: Supervisor intenta registrar fuera de su empresa o con rol Admin
- GIVEN solicitante Supervisor
- WHEN POST `/auth/register` con otra `empresaId` o role `Admin`
- THEN 403 Forbidden

#### Scenario: Otro rol intenta registrar
- GIVEN solicitante con rol distinto de Admin o Supervisor
- WHEN POST `/auth/register`
- THEN 403 Forbidden

## ADDED Requirements

### Requirement: Scoped User Administration
El sistema MUST aplicar scope por empresa en list, edit y delete de usuarios. Admin MAY operar sobre cualquier usuario; Supervisor MUST limitarse a usuarios de su propia empresa y MUST NOT cambiar `empresaId`.

#### Scenario: Admin lista todos los usuarios
- GIVEN solicitante Admin autenticado
- WHEN GET `/auth/contacts`
- THEN 200 con todos los usuarios

#### Scenario: Supervisor lista solo su empresa
- GIVEN solicitante Supervisor autenticado
- WHEN GET `/auth/contacts`
- THEN 200 con usuarios de su `empresaId`

#### Scenario: Supervisor edita usuario de otra empresa
- GIVEN solicitante Supervisor autenticado
- WHEN PATCH `/auth/users/:id` para un usuario fuera de su empresa
- THEN 403 Forbidden

#### Scenario: Supervisor borra usuario dentro de su empresa
- GIVEN solicitante Supervisor autenticado y usuario perteneciente a su empresa
- WHEN DELETE `/auth/users/:id`
- THEN 204 No Content
