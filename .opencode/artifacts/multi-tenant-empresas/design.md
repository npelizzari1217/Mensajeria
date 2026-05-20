---
id: multi-tenant-empresas-design
version: 1
lineage:
  derived_from: multi-tenant-empresas-propose
created_at: "2026-05-20T18:12:00Z"
---

# Design: Multi-Tenant Empresas

## Architecture Decision: Column-level multi-tenancy

**Decisión**: Usar `empresa_id` como columna en cada tabla de negocio, con una tabla `empresas` y una tabla de unión `user_empresas`.

**Alternativas consideradas**:
- Schema-level (PostgreSQL schemas por empresa): rechazado — complejo para Prisma, difícil de escalar en managed DBs
- Row-level security (PostgreSQL RLS): rechazado — acopla la lógica de negocio a la DB
- Database-level (una DB por empresa): rechazado — overhead operativo innecesario para este volumen

**Rationale**: Column-level es el approach estándar para SaaS multi-tenant con Clean Architecture. La lógica de filtrado vive en los repositories (infrastructure), no en la DB.

---

## Data Flow — Login Multi-Empresa

```
POST /v1/auth/login
{ email, password }
        │
        ▼
  LoginUseCase.execute()
    ├── Email.create(dto.email)
    ├── userRepo.findByEmail(email)
    ├── passwordHasher.compare(password, hash)
    ├── authPort.sign({ sub, role })          ← SIN empresaId
    ├── userRepo.getEmpresas(userId)          ← NUEVO
    └── return { accessToken, refreshToken,
                 user: profile,
                 empresas: [{id, nombre, role}] }

        │
        ▼ (frontend muestra selector)
        │
POST /v1/auth/select-empresa
{ empresaId }
        │
        ▼
  SelectEmpresaUseCase.execute()
    ├── userRepo.isMemberOf(userId, empresaId)
    ├── authPort.sign({ sub, role, empresaId })  ← CON empresaId
    └── return { accessToken, refreshToken, empresa }
```

---

## Entity Changes

### Nueva: EmpresaId (VO — shared-kernel)

```
packages/domain/src/shared/value-objects/empresa-id.ts
```

Igual patrón que `UserId`: `EmpresaId.create(value)` y `EmpresaId.reconstruct(existing)`.

### Nueva: Empresa (Entity — shared-kernel o auth)

```
packages/domain/src/auth/entities/empresa.ts
```

Props: `{ id: EmpresaId, nombre: string, createdAt: Timestamp }`

### Modificada: User

Agrega método `getEmpresas(): EmpresaMembership[]`:
```
interface EmpresaMembership {
  empresaId: EmpresaId;
  nombre: string;
  role: Role;
  isActive: boolean;
}
```
Esto se popula vía JOIN con `user_empresas` desde el repository — es transient, no se persiste en User directamente.

### Modificada: Message.create()

```
Message.create(
  senderId: UserId,
  empresaId: EmpresaId,    // ← NUEVO
  subject: Subject,
  body: MessageBody,
  recipientIds: UserId[],
  parentMessageId?: MessageId,
): Result<Message, Error>
```

Misma firma para `Group.create(..., empresaId)` y `Draft.create(..., empresaId)`.

---

## Repository Changes

Todos los repositories de messaging agregan `empresaId`:

```
// MessageRepository (domain port)
interface MessageRepository {
  save(message: Message): Promise<Result<void>>;
  findById(id: MessageId, empresaId: EmpresaId): Promise<Result<Message>>;
  findByRecipient(userId: UserId, empresaId: EmpresaId, ...): Promise<Result<Message[]>>;
  findBySender(userId: UserId, empresaId: EmpresaId, ...): Promise<Result<Message[]>>;
  search(query: string, empresaId: EmpresaId, ...): Promise<Result<Message[]>>;
}
```

Implementación Prisma: `where: { empresaId: empresaId.get(), ... }`

```
// PrismaMessageRepository
async findByRecipient(userId, empresaId, ...) {
  return prisma.message.findMany({
    where: {
      empresaId: empresaId.get(),  // ← filtro obligatorio
      recipients: { some: { recipientId: userId.get() } }
    },
    ...
  });
}
```

---

## Prisma Migration — Estrategia

### Paso 1: Crear tabla empresas

```sql
CREATE TABLE empresas (
  empresa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Paso 2: Insertar empresa default

```sql
INSERT INTO empresas (empresa_id, nombre) VALUES ('00000000-0000-0000-0000-000000000001', 'Default');
```

### Paso 3: Agregar empresa_id a cada tabla (nullable inicialmente)

```sql
ALTER TABLE messages ADD COLUMN empresa_id UUID;
ALTER TABLE groups ADD COLUMN empresa_id UUID;
ALTER TABLE drafts ADD COLUMN empresa_id UUID;
ALTER TABLE conversation_threads ADD COLUMN empresa_id UUID;
ALTER TABLE refresh_tokens ADD COLUMN empresa_id UUID;
```

### Paso 4: Asignar default a todos los registros existentes

```sql
UPDATE messages SET empresa_id = '00000000-0000-0000-0000-000000000001';
UPDATE groups SET empresa_id = '00000000-0000-0000-0000-000000000001';
UPDATE drafts SET empresa_id = '00000000-0000-0000-0000-000000000001';
UPDATE conversation_threads SET empresa_id = '00000000-0000-0000-0000-000000000001';
UPDATE refresh_tokens SET empresa_id = '00000000-0000-0000-0000-000000000001';
```

### Paso 5: Crear user_empresas

```sql
CREATE TABLE user_empresas (...);
INSERT INTO user_empresas (user_id, empresa_id, role, is_active)
  SELECT user_id, '00000000-0000-0000-0000-000000000001', role, true FROM users;
```

### Paso 6: Hacer empresa_id NOT NULL + FK

```sql
ALTER TABLE messages ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE messages ADD FOREIGN KEY (empresa_id) REFERENCES empresas(empresa_id);
-- (repetir para groups, drafts, conversation_threads, refresh_tokens)
```

---

## File Changes (orden de implementación)

### Fase 1 — Dominio (packages/domain)
| # | Archivo | Cambio |
|---|---|---|
| 1 | `src/shared/value-objects/empresa-id.ts` | NUEVO: VO EmpresaId |
| 2 | `src/auth/entities/empresa.ts` | NUEVO: Entity Empresa |
| 3 | `src/auth/entities/user.ts` | MOD: + getEmpresas() |
| 4 | `src/messaging/entities/message.ts` | MOD: + empresaId en create() |
| 5 | `src/messaging/entities/group.ts` | MOD: + empresaId en create() |
| 6 | `src/messaging/entities/draft.ts` | MOD: + empresaId en create() |
| 7 | `src/messaging/repositories/message-repository.ts` | MOD: + empresaId en firmas |
| 8 | `src/messaging/repositories/group-repository.ts` | MOD: + empresaId en firmas |
| 9 | `src/messaging/repositories/draft-repository.ts` | MOD: + empresaId en firmas |
| 10 | `src/auth/repositories/user-repository.ts` | MOD: + getEmpresas(), isMemberOf() |
| 11 | `src/index.ts` | MOD: export EmpresaId, Empresa |

### Fase 2 — Schema (api/prisma)
| # | Archivo | Cambio |
|---|---|---|
| 12 | `api/prisma/schema.prisma` | MOD: + Empresa, UserEmpresa, +5 FK columns |
| 13 | `api/prisma/migrations/*` | NUEVO: migration SQL |

### Fase 3 — Aplicación (api/src/application)
| # | Archivo | Cambio |
|---|---|---|
| 14 | `auth/use-cases/login.use-case.ts` | MOD: + getEmpresas() en respuesta |
| 15 | `auth/use-cases/register-user.use-case.ts` | MOD: + empresaId en registro |
| 16 | `auth/use-cases/select-empresa.use-case.ts` | NUEVO |
| 17 | `auth/ports/auth-port.ts` | MOD: TokenPayload + empresaId |
| 18 | `auth/dtos/*.dto.ts` | MOD: login/register DTOs |
| 19 | `messaging/use-cases/send-message.use-case.ts` | MOD: + empresaId en execute() |
| 20 | `messaging/use-cases/get-inbox.use-case.ts` | MOD: + empresaId en query |
| 21 | `messaging/use-cases/get-sent.use-case.ts` | MOD: + empresaId en query |
| 22 | `messaging/use-cases/search-messages.use-case.ts` | MOD: + empresaId en query |
| 23 | `messaging/use-cases/get-message.use-case.ts` | MOD: + empresaId en query |
| 24 | `messaging/use-cases/mark-as-read.use-case.ts` | MOD: + empresaId en query |
| 25 | `messaging/use-cases/reply-to-message.use-case.ts` | MOD: + empresaId |
| 26 | `messaging/use-cases/forward-message.use-case.ts` | MOD: + empresaId |
| 27 | `groups/use-cases/create-group.use-case.ts` | MOD: + empresaId |
| 28 | `groups/use-cases/list-user-groups.use-case.ts` | MOD: + empresaId en query |
| 29 | `groups/use-cases/*.use-case.ts` (todos) | MOD: + empresaId |
| 30 | `drafts/use-cases/*.use-case.ts` (todos) | MOD: + empresaId |

### Fase 4 — Infraestructura (api/src/infrastructure)
| # | Archivo | Cambio |
|---|---|---|
| 31 | `persistence/prisma-message.repository.ts` | MOD: + empresaId en todos los queries |
| 32 | `persistence/prisma-group.repository.ts` | MOD: + empresaId en todos los queries |
| 33 | `persistence/prisma-draft.repository.ts` | MOD: + empresaId en todos los queries |
| 34 | `persistence/prisma-user.repository.ts` | MOD: + getEmpresas(), isMemberOf() |
| 35 | `auth/jwt-auth-port.ts` | MOD: TokenPayload incluye empresaId |
| 36 | `persistence/prisma-thread.repository.ts` | MOD: + empresaId |

### Fase 5 — Presentación (api/src/presentation)
| # | Archivo | Cambio |
|---|---|---|
| 37 | `auth/auth.controller.ts` | MOD: + select-empresa endpoint |
| 38 | `auth/guards/auth.guard.ts` | MOD: valida empresaId y membresía |
| 39 | `auth/decorators/current-user.ts` | MOD: extrae empresaId |

### Fase 6 — Tests
| # | Archivo | Cambio |
|---|---|---|
| 40 | `packages/domain/src/__tests__/empresa-id.test.ts` | NUEVO |
| 41 | `packages/domain/src/__tests__/message.test.ts` | MOD: empresaId en tests |
| 42 | `api/src/application/auth/__tests__/login.test.ts` | MOD: empresas en respuesta |
| 43 | `api/src/application/messaging/__tests__/send-message.test.ts` | MOD: empresaId |

---

## Testing Strategy

| Nivel | Qué se prueba | Framework |
|---|---|---|
| Domain unit | EmpresaId.create(), Message.create() con empresaId, validación cross-tenant | vitest |
| Application unit | LoginUseCase con empresas, SelectEmpresaUseCase, use cases con empresaId mock | vitest |
| Integration | Prisma repos con filtro empresaId, queries devuelven solo datos de la empresa | vitest + test DB |
| E2E | Flujo completo: login → select empresa → enviar mensaje → inbox scoped | supertest |

---

## Rollback Plan
1. Los nuevos campos son aditivos — no hay columnas eliminadas
2. Si falla: revertir migration, eliminar columnas empresa_id
3. Los datos existentes no se pierden (empresa_id es FK nueva, no reemplaza nada)
4. Rollback del código: revertir commits en orden inverso
