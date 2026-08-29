# role-management Specification

## Purpose
CRUD de roles con ID numérico y jerarquía implícita. Reemplaza el enum Role por tabla persistente.

## Requirements

### Requirement: Role Table with Numeric ID
El sistema DEBE mantener una tabla `Role` con columnas: `id` (INT, PK, autoincrement), `name` (VARCHAR, unique, not null), `description` (VARCHAR, nullable). Los IDs DEBEN seguir jerarquía: menor ID = mayor privilegio.

Seed obligatorio: 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario.

#### Scenario: Seed inicial de roles
- GIVEN base de datos vacía
- WHEN se ejecuta la migración seed
- THEN existen 4 roles con IDs: Admin(1), Supervisor(2), Técnico(3), Usuario(4)

#### Scenario: ID menor implica mayor jerarquía
- GIVEN roles con IDs 1 y 3
- WHEN se evalúa `isAtLeast(rolActual, rolRequerido)`
- THEN rol ID 1 satisface rol ID 3, pero ID 3 NO satisface ID 1

---

### Requirement: Role CRUD (Admin)
El sistema DEBE permitir a Admin crear, modificar y eliminar roles mediante endpoints protegidos. Todos DEBEN requerir AuthGuard + RolesGuard + `@Roles(1)`.

#### Scenario: Crear rol
- GIVEN Admin autenticado (roleId=1) y nombre único válido
- WHEN POST `/roles` con `{ name, description }`
- THEN 201 y rol creado con ID auto-generado

#### Scenario: Nombre duplicado
- GIVEN Admin autenticado y nombre ya existente en la tabla Role
- WHEN POST `/roles` con nombre duplicado
- THEN 409 Conflict

#### Scenario: Modificar rol
- GIVEN Admin autenticado y rol existente ID=2
- WHEN PATCH `/roles/2` con `{ name: "NuevoNombre" }`
- THEN 200 con rol actualizado

#### Scenario: Eliminar rol con usuarios asignados
- GIVEN Admin autenticado y rol ID=3 con usuarios asignados (FK en User o UserEmpresa)
- WHEN DELETE `/roles/3`
- THEN 409 Conflict — no se puede eliminar un rol con usuarios activos

#### Scenario: Eliminar rol sin usuarios
- GIVEN Admin autenticado y rol ID=5 sin usuarios asignados
- WHEN DELETE `/roles/5`
- THEN 204 No Content

---

### Requirement: Role Read (Supervisor)
El sistema DEBE permitir a Supervisores listar roles disponibles para asignación de usuarios.

#### Scenario: Supervisor lista roles
- GIVEN Supervisor autenticado (roleId=2)
- WHEN GET `/roles`
- THEN 200 con lista de roles `{ id, name, description }`

#### Scenario: Usuario no autenticado intenta listar
- GIVEN request sin token válido
- WHEN GET `/roles`
- THEN 401 Unauthorized