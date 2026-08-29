# Delta for empresa-management

## MODIFIED Requirements

### Requirement: Assign User to Empresa
El sistema MUST permitir a Admin asociar un usuario existente a una empresa creando el vínculo `UserEmpresa` con `roleId`. El endpoint MUST requerir AuthGuard, RolesGuard y `@Roles(1)`.
(Previously: UserEmpresa no incluía roleId en la asignación)

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