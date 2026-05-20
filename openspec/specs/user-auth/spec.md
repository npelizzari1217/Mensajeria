---
title: "user-auth Specification"
change: mensajeria-core
phase: spec
artifact: spec
capability: user-auth
status: draft
---

# user-auth Specification

## Purpose
Autenticación y autorización de usuarios con JWT y roles RBAC. Base de seguridad para todo el sistema.

## Modelo
- **User**: id, email (único), name, password (hasheado), role, createdAt, updatedAt
- **Role**: enum [Admin, Supervisor, Técnico, Usuario]
- **Tokens**: access_token (JWT, corto plazo), refresh_token (largo plazo)
- **UserIdentity**: id + roles para checks de autorización

## Requirements

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

---

### Requirement: User Login + JWT Tokens
El sistema MUST autenticar usuarios con email+password y retornar access_token + refresh_token.

| Regla | Valor |
|-------|-------|
| access_token | JWT, expiración corta (recomendado: 15min) |
| refresh_token | almacenado en DB, httpOnly cookie, expiración larga |
| bcrypt | costo configurable, comparación constante de tiempo |

#### Scenario: Login exitoso
- GIVEN email existe, password coincide
- WHEN POST /auth/login
- THEN 200, access_token (JWT) + refresh_token cookie

#### Scenario: Credenciales inválidas
- GIVEN password incorrecto
- WHEN POST /auth/login
- THEN 401 Unauthorized, sin indicar si email existe

#### Scenario: Email no existe
- GIVEN email no registrado
- WHEN POST /auth/login
- THEN 401 Unauthorized (mismo mensaje que password erróneo)

---

### Requirement: Role-Based Access Control (RBAC)
El sistema MUST proteger endpoints por rol. Request sin rol requerido MUST recibir 403.

Jerarquía implícita (si aplica en implementación, spec solo declara existencia):
- Admin > Supervisor > Técnico > Usuario

#### Scenario: Usuario accede a recurso propio (permitido)
- GIVEN access_token válido, endpoint requiere rol Usuario o superior
- WHEN GET /messages/inbox
- THEN 200 OK

#### Scenario: Usuario intenta acceder a recurso Admin (denegado)
- GIVEN access_token de Usuario, endpoint requiere rol Admin
- WHEN GET /admin/users
- THEN 403 Forbidden

#### Scenario: Token sin firma válida → 401
- GIVEN access_token manipulado o firma incorrecta
- WHEN cualquier endpoint protegido
- THEN 401 Unauthorized

---

### Requirement: User Profile
El sistema MUST permitir obtener el perfil del usuario autenticado.

#### Scenario: Obtener perfil propio
- GIVEN access_token válido
- WHEN GET /auth/me
- THEN 200, { id, email, name, role, createdAt } — SIN password

---

### Requirement: Token Refresh
El sistema MUST permitir renovar access_token usando refresh_token.

#### Scenario: Refresh exitoso
- GIVEN refresh_token válido y activo en DB
- WHEN POST /auth/refresh
- THEN 200, nuevo access_token, opcionalmente nuevo refresh_token (rotation)

#### Scenario: Refresh token revocado
- GIVEN refresh_token eliminado de DB
- WHEN POST /auth/refresh
- THEN 401 Unauthorized

---

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

---

## Acceptance Criteria
1. [ ] Registro → Login → access_token válido y verificable
2. [ ] Password nunca se retorna en ninguna respuesta
3. [ ] Usuario sin token → 401 en endpoints protegidos
4. [ ] Usuario sin rol suficiente → 403
5. [ ] Email duplicado → 409
6. [ ] Enumeración de emails prevenida (login devuelve mismo 401 para email no existe vs password erróneo)
7. [ ] bcrypt es el único algoritmo de hash utilizado para passwords

## Out of Scope (próximas entregas)
- Permisos granulares por recurso
- OAuth / SSO
- 2FA
- Password recovery
- Refresh token family detection
