# Pattern: NestJS DI for Interface-Based Ports

**Scope**: api/src/application, api/src/infrastructure
**Status**: established

## Context

NestJS cannot resolve TypeScript interfaces via reflection because interfaces are erased at runtime. When a use case depends on a domain repository interface (e.g., `MessageRepository`), NestJS needs a concrete token to inject.

## Solution

Always use `@Inject('TokenName')` on constructor parameters that are interfaces. Register the implementation with `provide: 'TokenName', useClass: ImplClass` in the module.

```ts
// Use case constructor
constructor(
  @Inject('MessageRepository') private readonly repo: MessageRepository,
  @Inject('UserRepository') private readonly userRepo: UserRepository,
) {}

// Module registration
@Module({
  providers: [
    { provide: 'MessageRepository', useClass: PrismaMessageRepository },
    { provide: 'UserRepository', useClass: PrismaUserRepository },
    SendMessageUseCase,
  ],
})
export class MessagingModule {}
```

## Why Not custom class-based tokens?

Class-based tokens (`class MessageRepositoryToken {}`) work but add unnecessary boilerplate. String tokens are simpler and the convention is enforced by `nestjs.token_injection: required` in project overrides.

## Files Following This Pattern

- api/src/application/messaging/send-message.use-case.ts
- api/src/application/auth/login.use-case.ts
- api/src/application/drafts/save-draft.use-case.ts
- api/src/application/groups/create-group.use-case.ts
