# Delta for user-auth

## MODIFIED Requirements

### Requirement: User Registration
El sistema MUST permitir registrar usuarios con email + password + name + roleId, bajo caller context. El endpoint MUST requerir AuthGuard + RolesGuard + `@Roles(1, 2)`.
(Previously: usaba role string enum y decorator @Roles('Admin', 'Supervisor'))

| Regla | Valor |
|-------|-------|
| Email | único, formato válido, case-insensitive |
| Password | mínimo 8 caracteres |
| roleId | FK a tabla Role. Por defecto: 4 (Usuario). Admin puede asignar cualquier roleId; Supervisor NO puede asignar roleId=1 (Admin). |
| Empresa | Admin puede indicar cualquier `empresaId`; Supervisor solo la propia empresa |

#### Scenario: Admin registra usuario en cualquier empresa
- GIVEN solicitante Admin (roleId=1), datos válidos y `empresaId` arbitrario
- WHEN POST `/auth/register` con `{ roleId: 2 }`
- THEN 201 y usuario creado con `roleId=2`

#### Scenario: Supervisor registra usuario en su empresa
- GIVEN solicitante Supervisor (roleId=2), datos válidos y `empresaId` igual a su empresa
- WHEN POST `/auth/register` con `{ roleId: 3 }`
- THEN 201 y usuario creado con `roleId=3`

#### Scenario: Supervisor intenta registrar fuera de su empresa o con rol Admin
- GIVEN solicitante Supervisor (roleId=2)
- WHEN POST `/auth/register` con otra `empresaId` o `roleId: 1`
- THEN 403 Forbidden

#### Scenario: Otro rol intenta registrar
- GIVEN solicitante con roleId distinto de 1 o 2
- WHEN POST `/auth/register`
- THEN 403 Forbidden

---

### Requirement: User Login + JWT Tokens
El sistema MUST autenticar usuarios con email+password y retornar access_token + refresh_token. El JWT payload DEBE incluir `role` como string (nombre del rol) para retrocompatibilidad y `roleId` numérico. La respuesta HTTP DEBE incluir `role` expandido como `{ id, name }`.
(Previously: login devolvía role string plano; ahora devuelve roleId + role expandido)

| Regla | Valor |
|-------|-------|
| access_token | JWT con `roleId: number` y `role: string` en payload |
| refresh_token | almacenado en DB, httpOnly cookie, expiración larga |
| bcrypt | costo configurable, comparación constante de tiempo |

#### Scenario: Login exitoso
- GIVEN email existe, password coincide
- WHEN POST /auth/login
- THEN 200, access_token (JWT con `roleId` y `role` string) + refresh_token cookie + body con `{ user, role: { id: 1, name: "Admin" } }`

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
El sistema MUST proteger endpoints por rol usando IDs numéricos. Guards comparan jerarquía: un `roleId` menor o igual al requerido satisface la condición. Request sin rol requerido MUST recibir 403.
(Previously: usaba decorator @Roles('Admin'), ahora @Roles(1) con comparación numérica por jerarquía)

#### Scenario: Usuario accede a recurso propio (permitido)
- GIVEN access_token válido con roleId=4, endpoint requiere roleId ≤ 4
- WHEN GET /messages/inbox
- THEN 200 OK

#### Scenario: Usuario intenta acceder a recurso Admin (denegado)
- GIVEN access_token con roleId=4, endpoint requiere roleId ≤ 1
- WHEN GET /admin/users
- THEN 403 Forbidden

#### Scenario: Token sin firma válida → 401
- GIVEN access_token manipulado o firma incorrecta
- WHEN cualquier endpoint protegido
- THEN 401 Unauthorized

---

### Requirement: User Profile
El sistema MUST permitir obtener el perfil del usuario autenticado, incluyendo rol expandido.
(Previously: devolvía role como string; ahora devuelve roleId + role: { id, name })

#### Scenario: Obtener perfil propio
- GIVEN access_token válido
- WHEN GET /auth/me
- THEN 200, `{ id, email, name, roleId, role: { id, name }, createdAt }` — SIN password

---

### Requirement: Scoped User Administration
El sistema MUST aplicar scope por empresa en list, edit y delete de usuarios. ListUsers DEBE permitir filtrar por `roleId`. Admin MAY operar sobre cualquiera; Supervisor MUST limitarse a su empresa.
(Previously: sin filtro por roleId)

#### Scenario: Admin lista todos los usuarios
- GIVEN solicitante Admin autenticado (roleId=1)
- WHEN GET `/auth/contacts`
- THEN 200 con todos los usuarios, cada uno incluye `roleId` y `role: { id, name }`

#### Scenario: Admin filtra usuarios por roleId
- GIVEN solicitante Admin autenticado
- WHEN GET `/auth/contacts?roleId=2`
- THEN 200 con solo los usuarios que tienen `roleId=2`

#### Scenario: Supervisor lista solo su empresa
- GIVEN solicitante Supervisor autenticado (roleId=2)
- WHEN GET `/auth/contacts`
- THEN 200 con usuarios de su `empresaId`

#### Scenario: Supervisor edita usuario de otra empresa
- GIVEN solicitante Supervisor autenticado
- WHEN PATCH `/auth/users/:id` para usuario fuera de su empresa
- THEN 403 Forbidden

#### Scenario: Supervisor borra usuario dentro de su empresa
- GIVEN solicitante Supervisor autenticado y usuario perteneciente a su empresa
- WHEN DELETE `/auth/users/:id`
- THEN 204 No Content