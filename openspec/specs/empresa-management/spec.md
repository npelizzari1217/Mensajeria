---
title: "empresa-management Specification"
change: mensajeria-core
phase: spec
artifact: spec
capability: empresa-management
status: draft
---

# empresa-management Specification

## Purpose
Administración completa de empresas con control estricto por rol. Solo Admin puede crear, consultar, actualizar, borrar y asignar usuarios a empresas.

## Requirements

### Requirement: Empresa CRUD
El sistema MUST permitir a Admin gestionar empresas mediante API protegida. Todos los endpoints MUST requerir AuthGuard, RolesGuard y `@Roles(Admin)`.

#### Scenario: Crear empresa
- GIVEN un Admin autenticado y un `nombre` único válido de hasta 100 caracteres
- WHEN POST `/empresas`
- THEN 201 y la empresa creada

#### Scenario: Listar y obtener empresa
- GIVEN un Admin autenticado
- WHEN GET `/empresas` o GET `/empresas/:id`
- THEN 200 con la lista completa o la empresa solicitada

#### Scenario: Actualizar nombre de empresa
- GIVEN un Admin autenticado y una empresa existente
- WHEN PATCH `/empresas/:id` con un nuevo `nombre` único
- THEN 200 con el nombre actualizado

#### Scenario: Borrar empresa inexistente
- GIVEN un Admin autenticado
- WHEN DELETE `/empresas/:id` para un id inexistente
- THEN 404 Not Found

#### Scenario: Nombre inválido o duplicado
- GIVEN `nombre` vacío, mayor a 100 caracteres o ya existente
- WHEN POST `/empresas` o PATCH `/empresas/:id`
- THEN 400 para validación inválida o 409 si el nombre ya existe

### Requirement: Assign User to Empresa
El sistema MUST permitir a Admin asociar un usuario existente a una empresa creando el vínculo `UserEmpresa` con `roleId`. El endpoint MUST requerir AuthGuard, RolesGuard y `@Roles(1)`.

#### Scenario: Asignar usuario existente con rol
- GIVEN un Admin autenticado (roleId=1), una empresa existente y un usuario existente
- WHEN POST `/empresas/:id/users` con `{ userId, roleId }`
- THEN 201 y se crea `UserEmpresa` con el `roleId` especificado

#### Scenario: Usuario o empresa inexistente
- GIVEN un Admin autenticado
- WHEN POST `/empresas/:id/users` con empresa o usuario inexistente
- THEN 404 Not Found

#### Scenario: roleId inválido
- GIVEN un Admin autenticado y datos válidos pero roleId que no existe en tabla Role
- WHEN POST `/empresas/:id/users`
- THEN 400 Bad Request — roleId debe referenciar un rol existente
