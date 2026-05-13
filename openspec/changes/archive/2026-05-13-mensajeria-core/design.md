---
title: "Design: mensajeria-core"
change: mensajeria-core
phase: design
artifact: design
status: draft
---

# Design: mensajeria-core

## Technical Approach

Greenfield system. Build bottom-up: Domain VOs + Entities → Application use cases + Ports → Infrastructure (Prisma repos, JWT, bcrypt) → Presentation (NestJS REST controllers + Guards). Two capabilities delivered in one change: `user-auth` and `messaging-core`.

The stack: Turborepo monorepo with `packages/domain/` (pure TypeScript, zero deps), `api/` (NestJS + Prisma + PostgreSQL), `web/` (React + Vite). `packages/domain/` is the shared kernel — every layer depends on it.

---

## 1. Directory Structure

```
mensajeria/
├── packages/domain/src/
│   ├── shared/
│   │   ├── value-objects/
│   │   │   ├── user-id.ts
│   │   │   ├── message-id.ts
│   │   │   ├── email.ts
│   │   │   ├── role.ts
│   │   │   ├── subject.ts
│   │   │   ├── message-body.ts
│   │   │   └── message-status.ts
│   │   ├── errors/
│   │   │   ├── domain-error.ts
│   │   │   └── not-found-error.ts
│   │   └── result.ts
│   ├── auth/
│   │   ├── entities/
│   │   │   └── user.ts
│   │   ├── value-objects/
│   │   │   ├── password.ts
│   │   │   └── user-identity.ts
│   │   ├── events/
│   │   │   └── user-registered.ts
│   │   └── repositories/
│   │       └── user-repository.ts
│   └── messaging/
│       ├── entities/
│       │   ├── message.ts
│       │   ├── message-recipient.ts
│       │   └── conversation-thread.ts
│       ├── value-objects/
│       │   └── thread-id.ts
│       ├── events/
│       │   └── message-sent.ts
│       └── repositories/
│           └── message-repository.ts
│
├── api/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── application/
│   │   │   ├── auth/
│   │   │   │   ├── ports/
│   │   │   │   │   ├── auth-port.ts
│   │   │   │   │   └── password-hasher.ts
│   │   │   │   ├── use-cases/
│   │   │   │   │   ├── register-user.use-case.ts
│   │   │   │   │   ├── login.use-case.ts
│   │   │   │   │   ├── get-current-user.use-case.ts
│   │   │   │   │   └── refresh-token.use-case.ts
│   │   │   │   └── dtos/
│   │   │   │       ├── register-user.dto.ts
│   │   │   │       ├── login.dto.ts
│   │   │   │       ├── auth-response.dto.ts
│   │   │   │       └── user-profile.dto.ts
│   │   │   └── messaging/
│   │   │       ├── use-cases/
│   │   │       │   ├── send-message.use-case.ts
│   │   │       │   ├── get-inbox.use-case.ts
│   │   │       │   ├── get-sent.use-case.ts
│   │   │       │   ├── get-message-detail.use-case.ts
│   │   │       │   └── mark-as-read.use-case.ts
│   │   │       └── dtos/
│   │   │           ├── send-message.dto.ts
│   │   │           ├── message-list-item.dto.ts
│   │   │           ├── message-detail.dto.ts
│   │   │           └── pagination.dto.ts
│   │   ├── infrastructure/
│   │   │   ├── auth/
│   │   │   │   ├── jwt-auth-port.ts
│   │   │   │   ├── bcrypt-password-hasher.ts
│   │   │   │   └── guards/
│   │   │   │       ├── auth.guard.ts
│   │   │   │       └── roles.guard.ts
│   │   │   ├── persistence/
│   │   │   │   ├── prisma/
│   │   │   │   │   ├── prisma.service.ts
│   │   │   │   │   ├── mappers/
│   │   │   │   │   │   ├── user-mapper.ts
│   │   │   │   │   │   └── message-mapper.ts
│   │   │   │   │   └── repositories/
│   │   │   │   │       ├── prisma-user.repository.ts
│   │   │   │   │       └── prisma-message.repository.ts
│   │   │   │   └── seed.ts
│   │   │   └── config/
│   │   │       └── env.config.ts
│   │   └── presentation/
│   │       ├── auth/
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.module.ts
│   │       │   └── dto/
│   │       │       ├── register.request.ts
│   │       │       └── login.request.ts
│   │       ├── messaging/
│   │       │   ├── messaging.controller.ts
│   │       │   ├── messaging.module.ts
│   │       │   └── dto/
│   │       │       ├── send-message.request.ts
│   │       │       └── pagination.query.ts
│   │       └── shared/
│   │           ├── filters/
│   │           │   └── exception.filter.ts
│   │           └── interceptors/
│   │               └── response.interceptor.ts
│   └── src/main.ts
│
└── web/
    └── src/
        ├── api/
        │   └── client.ts
        ├── contexts/
        │   └── auth.context.tsx
        ├── pages/
        │   ├── login.page.tsx
        │   ├── inbox.page.tsx
        │   ├── compose.page.tsx
        │   └── message-detail.page.tsx
        ├── components/
        │   ├── protected-route.tsx
        │   └── layout.tsx
        └── App.tsx
```

---

## 2. Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION (api/src/presentation/)        │
│  AuthController · MessagingController · AuthGuard · RolesGuard   │
│  DTOs · ExceptionFilter · ResponseInterceptor                   │
│  ══> depends on application/ ONLY                               │
├─────────────────────────────────────────────────────────────────┤
│                      APPLICATION (api/src/application/)          │
│  Use Cases (RegisterUser, Login, SendMessage, GetInbox, etc.)   │
│  Ports (AuthPort, PasswordHasher)                               │
│  DTOs (register-user.dto, send-message.dto, etc.)              │
│  ══> depends on domain/ ONLY                                    │
├─────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE (api/src/infrastructure/)    │
│  JwtAuthPort · BcryptPasswordHasher                             │
│  PrismaUserRepo · PrismaMessageRepo                             │
│  UserMapper · MessageMapper                                     │
│  PrismaService · EnvConfig                                      │
│  ══> depends on domain/ + application/ ONLY                     │
├─────────────────────────────────────────────────────────────────┤
│                      DOMAIN (packages/domain/src/)               │
│  VOs (Email · UserId · Role · Subject · MessageBody · etc.)    │
│  Entities (User · Message · MessageRecipient · Conversation)    │
│  Repository Interfaces (UserRepository · MessageRepository)     │
│  Domain Events (UserRegistered · MessageSent)                   │
│  Result<T,E> · DomainError                                      │
│  ══> imports NOTHING — zero external deps                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Prisma Data Model

```prisma
enum Role {
  ADMIN
  SUPERVISOR
  TECNICO
  USUARIO
}

enum MessageStatus {
  PENDING
  DELIVERED
  READ
}

model User {
  id        String   @id @default(uuid()) @map("user_id")
  email     String   @unique
  password  String   @map("password_hash")
  name      String   @map("display_name")
  role      Role     @default(USUARIO)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  sentMessages      Message            @relation("sender")
  messageRecipients MessageRecipient[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("refresh_tokens")
}

model Message {
  id              String              @id @default(uuid()) @map("message_id")
  senderId        String              @map("sender_id")
  sender          User                @relation("sender", fields: [senderId], references: [id])
  threadId        String?             @map("thread_id")
  thread          ConversationThread? @relation(fields: [threadId], references: [id])
  parentMessageId String?             @map("parent_message_id")
  parentMessage   Message?            @relation("MessageReplies", fields: [parentMessageId], references: [id])
  replies         Message[]           @relation("MessageReplies")
  subject         String
  body            String
  sentAt          DateTime            @default(now()) @map("sent_at")
  createdAt       DateTime            @default(now()) @map("created_at")

  recipients MessageRecipient[]

  @@index([senderId])
  @@index([threadId])
  @@map("messages")
}

model MessageRecipient {
  id          String        @id @default(uuid())
  messageId   String        @map("message_id")
  message     Message       @relation(fields: [messageId], references: [id], onDelete: Cascade)
  recipientId String        @map("recipient_id")
  recipient   User          @relation(fields: [recipientId], references: [id])
  status      MessageStatus @default(PENDING)
  readAt      DateTime?     @map("read_at")
  createdAt   DateTime      @default(now()) @map("created_at")

  @@unique([messageId, recipientId])
  @@index([recipientId, status])
  @@map("message_recipients")
}

model ConversationThread {
  id           String   @id @default(uuid()) @map("thread_id")
  subject      String
  messageCount Int      @default(0) @map("message_count")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  messages Message[]

  @@map("conversation_threads")
}
```

---

## 4. API Contracts

### Auth Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/v1/auth/register` | Optional (no token for self-register) | `{ email, password, name, role? }` | `201 { user }` |
| POST | `/v1/auth/login` | None | `{ email, password }` | `200 { accessToken }` + `Set-Cookie: refreshToken` |
| POST | `/v1/auth/refresh` | Cookie | — | `200 { accessToken }` |
| GET | `/v1/auth/me` | Bearer | — | `200 { user }` |

### Messaging Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/v1/messages` | Bearer | `{ recipientId, subject, body }` | `201 { message }` |
| GET | `/v1/messages/inbox` | Bearer | `?page=1&pageSize=20&status=unread\|read` | `200 { data[], total, page, pageSize }` |
| GET | `/v1/messages/sent` | Bearer | `?page=1&pageSize=20` | `200 { data[], total, page, pageSize }` |
| GET | `/v1/messages/:id` | Bearer | — | `200 { message }` or `403` |
| PATCH | `/v1/messages/:id/read` | Bearer | — | `200 { recipient }` |
| GET | `/v1/messages/:id/thread` | Bearer | — | `200 { thread, messages[] }` |

### Response Envelope

```typescript
// Success
{ data: T }
{ data: T[], total: number, page: number, pageSize: number }

// Error
{ error: { code: string, message: string, details?: unknown } }
```

---

## 5. Auth Flow

```
Registration:
  Client → POST /auth/register { email, password, name }
    → AuthController.parse() → RegisterUserUseCase.execute(dto)
      → Email.create(dto.email)         // VO validation
      → Password.create(dto.password)   // VO validation
      → passwordHasher.hash(password)   // bcrypt
      → User.create(email, hashed, ...) // domain entity
      → userRepo.save(user)
      → emit UserRegistered event
    ← 201 { user: UserProfileDTO }

Login:
  Client → POST /auth/login { email, password }
    → AuthController.parse() → LoginUseCase.execute(dto)
      → userRepo.findByEmail(email)
      → passwordHasher.compare(password, user.password)  // constant-time
      → authPort.sign({ userId, role })                   // JWT
      → save refreshToken in DB
    ← 200 { accessToken } + Set-Cookie: refreshToken (httpOnly, secure, sameSite=strict)

Middleware chain:
  Request → AuthGuard (extract token from Authorization: Bearer or cookie)
    → authPort.verify(token) → { userId, role }
    → inject req.user = UserIdentity(userId, role)
  → RolesGuard (if present) → check user.role meets required role
  → Controller → Use Case
```

---

## 6. Messaging Flow

```
Send Message:
  POST /v1/messages { recipientId, subject, body }
  → AuthGuard → injects UserIdentity
  → MessagingController → SendMessageUseCase.execute({
      senderId: currentUser.userId,
      recipientId: RecipientId.create(dto.recipientId),
      subject: Subject.create(dto.subject),
      body: MessageBody.create(dto.body),
    })
  → userRepo.findById(recipientId) → if null, return NotFound (404)
  → message = Message.create(senderId, subject, body, [recipientId])
  → messageRepo.save(message)       // transactional: message + recipients
  → emit MessageSent event
  ← 201 { message: MessageDetailDTO }

List Inbox:
  GET /v1/messages/inbox?page=1&pageSize=20&status=unread
  → GetInboxUseCase.execute({ userId, page, pageSize, status? })
  → messageRepo.findByRecipient(userId, status, { page, pageSize })
  ← 200 { data: MessageListItemDTO[], total, page, pageSize }

Mark as Read:
  PATCH /v1/messages/:id/read
  → MarkAsReadUseCase.execute({ userId, messageId })
  → messageRepo.findRecipient(messageId, userId)
      → if null → 403 (not a recipient)
  → recipient.markRead()                 // sets status=READ, readAt=now
  → messageRepo.saveRecipient(recipient)
  ← 200 { recipient: { status, readAt } }

Authorization per message:
  GetMessageDetailUseCase checks:
    - Is currentUser the sender? → allow
    - Is currentUser a recipient? → allow
    - Otherwise → 403 Forbidden
```

---

## 7. Technical Decisions

### 7.1 NestJS Module Structure

| Option | Tradeoff | Decision |
|--------|----------|----------|
| One module per feature | Clear boundaries, separate DI scopes | ✅ **Two modules: AuthModule + MessagingModule** |
| Single AppModule with all providers | Simple but grows unmanageable | ❌ Rejected |
| Global modules for repos | Convenient but hides dependencies | ❌ Rejected |

**AuthModule** wires: AuthController + use cases + PrismaUserRepository + JwtAuthPort + BcryptHasher.
**MessagingModule** wires: MessagingController + use cases + PrismaMessageRepository.
Repository injection uses `Symbol` tokens defined in domain interfaces.

### 7.2 Prisma Mapper Pattern

Mappers are stateless classes in `infrastructure/persistence/prisma/mappers/`:

```
toDomain(prismaModel): DomainEntity   // Prisma → Domain (VOs)
toPrisma(domainEntity): PrismaCreate  // Domain → Prisma (primitives)
```

- `toDomain` creates VOs via `Email.create(row.email).unwrap()` — trusted data from DB, so `unwrap()` is safe after DB validation.
- `toPrisma` extracts `.get()` from each VO before passing to Prisma.
- Domain entities use `static reconstruct(props)` for reconstitution from persistence (skips runtime validation that `create()` enforces).

### 7.3 Auth Port/Adapter

```
// application/auth/ports/auth-port.ts
export interface AuthPort {
  sign(payload: TokenPayload): string
  verify(token: string): TokenPayload
}

// infrastructure/auth/jwt-auth-port.ts
export class JwtAuthPort implements AuthPort {
  constructor(private readonly secret: string, private readonly expiresIn: string) {}
  sign(payload) { return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn }) }
  verify(token) { return jwt.verify(token, this.secret) as TokenPayload }
}
```

`PasswordHasher` port same pattern: `hash(plain): string`, `compare(plain, hash): boolean` — implemented by `BcryptPasswordHasher`.

### 7.4 API Design Contracts

- Global prefix `/v1` via NestJS `setGlobalPrefix('v1')`.
- Controllers are thin: parse DTO → validate with Zod → call use case → map response.
- Error mapping: `ExceptionFilter` catches `Result.Err` domain errors → maps to HTTP codes (NotFound → 404, NotAuthorized → 403, ValidationError → 400, Conflict → 409).
- Pagination: always returns `{ data, total, page, pageSize }`. Max pageSize = 100.

### 7.5 Error Handling with Result

```typescript
// packages/domain/src/shared/result.ts
export type Result<T, E = DomainError> = Ok<T, E> | Err<T, E>

// Use cases always return Result
class SendMessageUseCase {
  async execute(dto: SendMessageDTO): Promise<Result<MessageDetailDTO, DomainError>> {
    // ...
    if (!recipient) return err(new NotFoundError('User', dto.recipientId))
    // ...
    return ok(messageDetail)
  }
}
```

Domain errors defined alongside their aggregate: `EmailAlreadyExists`, `InvalidCredentials`, `MessageNotFound`, `NotAuthorized`, `InvalidMessageStatus`.

---

## 8. Testing Strategy

| Layer | What | How |
|-------|------|-----|
| **Domain/entities** | VO validation, entity behavior, equality | Plain Jest tests, zero deps |
| **Domain/repositories** | Interface contract verification | Interface testing via ts-auto-mock |
| **Application/use cases** | execute() with mocked repos and ports | Jest + mocks, Result assertions |
| **Infrastructure/repos** | Prisma mapping round-trip | Jest + real Testcontainers Postgres |
| **Infrastructure/auth** | JWT sign/verify, bcrypt hash/compare | Jest with real libs |
| **Presentation/controllers** | HTTP status codes, DTO validation | @nestjs/testing + mocked use cases |
| **Presentation/guards** | AuthGuard, RolesGuard | @nestjs/testing with ExecutionContext mock |
| **E2E** | Full register → login → send → receive flow | Supertest + Testcontainers |

---

## 9. Open Questions

- [ ] Definir valor exacto de `expiresIn` para access_token (15min sugerido) y refresh_token rotation strategy
- [ ] Confirmar si ConversationThread se crea automáticamente al enviar primer mensaje o se requiere endpoint separado
- [ ] Rate limiting: incluir en esta entrega o delegar a infraestructura (nginx/cloudflare)?
