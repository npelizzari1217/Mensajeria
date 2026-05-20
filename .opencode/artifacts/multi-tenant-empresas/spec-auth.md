---
id: multi-tenant-empresas-spec-auth
version: 1
lineage:
  derived_from: multi-tenant-empresas-propose
capability: auth
created_at: "2026-05-20T18:10:00Z"
---

# Delta Spec: Autenticación Multi-Empresa

## REQ-AUTH-001: Login devuelve empresas del usuario

El endpoint de login, además del token, DEBE devolver la lista de empresas a las que pertenece el usuario.

### Scenario: Usuario con una empresa
- **Given** un usuario registrado en la empresa "Acme Corp"
- **When** inicia sesión con email y password correctos
- **Then** recibe accessToken, refreshToken, user profile Y lista `empresas: [{ id, nombre, role }]`
- **And** el accessToken NO contiene empresaId (token pre-selección)

### Scenario: Usuario con múltiples empresas
- **Given** un usuario miembro de "Acme Corp" (Admin) y "Beta SA" (Usuario)
- **When** inicia sesión con email y password correctos
- **Then** recibe `empresas: [{ id: "a1", nombre: "Acme Corp", role: "ADMIN" }, { id: "b1", nombre: "Beta SA", role: "USUARIO" }]`

### Scenario: Credenciales inválidas
- **Given** cualquier email
- **When** inicia sesión con password incorrecto
- **Then** recibe 401 InvalidCredentialsError
- **And** el mensaje de error NO revela si el email existe

---

## REQ-AUTH-002: Selección de empresa post-login

El usuario DEBE poder seleccionar una empresa después del login para obtener un token scoped.

### Scenario: Selección válida
- **Given** un usuario autenticado (token pre-selección) miembro de "Acme Corp"
- **When** envía `POST /v1/auth/select-empresa { empresaId: "a1" }`
- **Then** recibe nuevo accessToken (con empresaId en payload) y refreshToken
- **And** el token contiene `{ sub, role, empresaId }`

### Scenario: Empresa no pertenece al usuario
- **Given** un usuario autenticado que NO es miembro de "Beta SA"
- **When** envía `POST /v1/auth/select-empresa { empresaId: "b1" }`
- **Then** recibe 403 Forbidden
- **And** el mensaje indica que no tiene acceso a esa empresa

### Scenario: Empresa inexistente
- **Given** un usuario autenticado
- **When** envía `POST /v1/auth/select-empresa { empresaId: "inexistente" }`
- **Then** recibe 404 EmpresaNotFoundError

### Scenario: Token expirado
- **Given** un token pre-selección expirado
- **When** intenta seleccionar empresa
- **Then** recibe 401 Unauthorized

---

## REQ-AUTH-003: Registro asigna empresa

Al registrar un usuario nuevo, DEBE asignarse a una empresa.

### Scenario: Registro exitoso
- **Given** una empresa "Acme Corp" existente
- **When** se registra un usuario con `{ email, password, name, empresaId: "a1" }`
- **Then** se crea el usuario Y la entrada en user_empresas
- **And** el usuario queda activo en la empresa

### Scenario: Empresa no existe
- **Given** un empresaId inexistente
- **When** se intenta registrar
- **Then** recibe 404 EmpresaNotFoundError

---

## REQ-AUTH-004: Token scoped por empresa

Todo endpoint de mensajería/grupos/drafts DEBE validar que el token incluya empresaId y que el usuario tenga membresía activa.

### Scenario: Token sin empresaId en endpoint protegido
- **Given** un token pre-selección (sin empresaId)
- **When** se intenta acceder a `GET /v1/messaging/inbox`
- **Then** recibe 401 "Empresa no seleccionada"

### Scenario: Membresía inactiva
- **Given** un token con empresaId válida pero membresía `isActive: false`
- **When** se intenta acceder a cualquier endpoint scoped
- **Then** recibe 403 "Membresía inactiva en esta empresa"
