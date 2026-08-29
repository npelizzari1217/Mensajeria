# Exploration: Mapeo de impacto "roles-tabla"

## Current State

El sistema tiene TRES representaciones del mismo concepto "Role de usuario":
1. **Prisma schema**: `enum Role { ADMIN, SUPERVISOR, TECNICO, USUARIO }` (UPPER_CASE, 4 valores)
2. **Dominio TypeScript**: `enum Role { Admin, Supervisor, Tecnico, Usuario }` (PascalCase, 4 valores)
3. **Frontend**: `ROLES = { Admin, Supervisor, Tecnico, Usuario }` (PascalCase const, 4 valores)

Hay un mapper (`api/src/infrastructure/persistence/prisma/mappers/user-mapper.ts`) con funciones `toPrismaRole()` y `toDomainRole()` que convierten entre ambos enums. Este mapper es frágil: cada vez que se agrega/quita un rol, hay que tocar 3+ lugares.

El role se persiste como string UPPER_CASE en PostgreSQL (`Role` type). El JWT lleva el role como string PascalCase. Las comparaciones de autorización se hacen con strings en use cases (`caller.callerRole === 'Admin'`), guards (`user.role === role`), y frontend (`isAdmin(user?.role)`).

**GroupRole (ADMIN/MEMBER de grupos de mensajería) es un concepto DISTINTO y NO se toca en este cambio.**

## Affected Areas

### Total: 38 archivos

| Capa | Archivos | Tipo de cambio |
|------|----------|----------------|
| Domain | 6 | enum→FK |
| Domain Tests | 2 | enum→FK |
| Application Ports | 1 | enum→FK |
| Application DTOs | 5 | string→FK |
| Application Use Cases | 10 | enum→FK, string→FK |
| Infrastructure Auth | 5 | enum→FK |
| Infrastructure Persistence | 2 | mapper→eliminar, string→FK |
| Presentation | 6 | enum→FK, string→FK |
| Prisma | 4 | enum→FK |
| API Tests | 2 | enum→FK, string→FK |
| Web Constants | 1 | constante→API |
| Web Context | 1 | constante→API |
| Web Components | 3 | constante→API |
| Web Pages | 3 | constante→API |
| Web API Client | 1 | string→FK |
| Web Tests | 2 | constante→API |
| Mobile | 1 | constante→API |
| CSS | 1 | sin cambios |

## Approaches

### 1. Tabla Role con ID numérico + nombres inmutables
Crear `model Role { id Int @id @default(autoincrement()), name String @unique }` en Prisma. Agregar `roleId Int` con FK a `User` y `UserEmpresa`. Migrar datos existentes. Eliminar enum Role de Prisma, el enum Role de dominio, y el mapper.
- **Pros**: Centraliza definición, extensible (nuevos roles sin deploy de código), elimina mapper, jerarquía numérica en `isAtLeast()`.
- **Cons**: Migración de BD compleja, rompe API/JWT si cambia de string a number, 38 archivos a modificar.
- **Effort**: Alto

### 2. Tabla Role con ID string (nombre como PK)
Crear `model Role { name String @id }` con PK `'Admin'`, `'Supervisor'`, etc.
- **Pros**: No rompe JWT/API (el role sigue siendo string), menos cambios.
- **Cons**: Sin jerarquía numérica para `isAtLeast()`, no tan limpio como IDs numéricos.
- **Effort**: Medio

### 3. Tabla Role con ID numérico pero mantener strings en API/JWT
Crear tabla con `id Int` + `name String`. El JWT/API sigue usando `name` (string). Solo cambia la BD y el dominio.
- **Pros**: No rompe clientes (web, mobile). Cambios acotados a backend. Jerarquía numérica en dominio.
- **Cons**: El mapper se elimina igual, pero aún hay que tocar ~25 archivos.
- **Effort**: Medio-Alto

## Recommendation

**Approach 3**: Tabla Role con `id INT` + `name VARCHAR`, pero mantener el role como string en JWT/API. Esto permite:
- Centralizar la definición en BD
- Jerarquía numérica para `isAtLeast()` en dominio
- NO romper los clientes web/mobile (el JWT y API responses siguen llevando `role: "Admin"`)
- Migrar gradualmente: primero BD + dominio, después (opcional) cambiar API a IDs

La jerarquía se modela con `id`: 1=Admin, 2=Supervisor, 3=Tecnico, 4=Usuario.

## Risks

1. **ALTO — Migración de datos**: Crear tabla, migrar filas, agregar FK, dropear type `Role`. Si falla, BD inconsistente.
2. **ALTO — Rompimiento de API**: Si `role` cambia de string a number en JWT/API.
3. **ALTO — RolesGuard + decorators**: `@Roles(Role.Admin)` deja de compilar si se elimina el enum.
4. **MEDIO — Hardcodeos en frontend**: `<select>` de roles en `users-admin.page.tsx` con valores fijos.
5. **MEDIO — Seed**: Debe reescribirse para usar la tabla.
6. **MEDIO — `callerRole` string comparisons**: `caller.callerRole === 'Admin'` debe migrar.
7. **BAJO — GroupRole confusión**: Nombres similares (ADMIN) pero concepto distinto.

## Dependencies

```
Prisma schema (enum → model)
├── UserMapper (eliminar)
│   └── PrismaUserRepository
│       └── Use cases (8 afectados)
│           └── Controllers + Guards + Decorators
│               └── JWT payload → Clientes (web, mobile)
├── Domain RoleVO / Role enum (adaptar)
│   ├── User entity
│   │   └── Domain tests
│   └── UserIdentity VO
├── Seed
├── API Tests
├── Web constants/roles.ts
│   ├── Web components
│   ├── Web pages
│   └── Web tests
└── Mobile auth context
```

## Ready for Proposal

**Yes.** El mapeo está completo. Recomiendo proceder con `sdd-propose` para crear la propuesta formal del cambio con approach 3 (tabla con ID numérico, strings en API).
