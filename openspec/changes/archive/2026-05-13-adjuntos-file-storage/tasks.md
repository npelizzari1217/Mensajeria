# Tasks: adjuntos-file-storage

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~730 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain+Schema → PR 2: Infra+App → PR 3: Present+Web+Tests |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain types + Prisma schema | PR 1 | Base: main. ~145 lines |
| 2 | Infra adapters + use cases | PR 2 | Depends on PR 1. ~280 lines |
| 3 | Controller, module, web, tests | PR 3 | Depends on PR 2. ~302 lines |

## Phase 1: Foundation — Domain + Schema

- [x] 1.1 Create `packages/domain/src/shared/value-objects/file-id.ts` — UUID-based FileId VO with reconstruct + create (note: placed in `shared/value-objects/` per task directive, not `storage/`)
- [x] 1.2 Create `packages/domain/src/messaging/ports/file-storage.ts` — IFileStorage port: upload, getUrl, delete, getPath (note: placed in `messaging/ports/` per task directive, not `storage/`)
- [x] 1.3 Create `packages/domain/src/messaging/entities/attachment.ts` — Minimal reconstruct + create Attachment entity (note: placed in `messaging/entities/` per task directive, not `storage/entities/`)
- [x] 1.4 Create `packages/domain/src/messaging/repositories/attachment-repository.ts` — AttachmentRepository port: save, findById, findByMessageId, delete (note: placed in `messaging/repositories/` per task directive, not `storage/repositories/`)
- [x] 1.5 Create `packages/domain/src/shared/errors/storage-error.ts` — StorageError (deferred to PR 2; generic file I/O error; placed in `shared/errors/` per existing error pattern)
- [x] 1.6 Modify `packages/domain/src/index.ts` — Export all new storage types
- [x] 1.7 Modify `api/prisma/schema.prisma` — Add Attachment model with FK to Message + `@map` conventions + pre-existing schema fixes (RefreshToken/User relation, sentMessages array type)
- [x] 1.8 Create migration SQL — `prisma/migrations/20260513000001_add_attachment_model/migration.sql` (manual creation; DB not available in this env — run `npx prisma migrate dev` when DB is accessible)

Criteria: FileId validates UUID; IFileStorage has 4 methods; Attachment entity matches Prisma shape; `prisma generate` succeeds

## Phase 2: Core — Infrastructure + Application

- [x] 2.1 Create `api/src/infrastructure/storage/local-file-storage.ts` — Disk adapter: `{basePath}/{fileId}/{filename}`, path traversal prevention, configurable base path & base URL
- [x] 2.2 Create `api/src/infrastructure/persistence/prisma/mappers/attachment-mapper.ts` — Prisma Attachment ↔ domain Attachment (moved from `storage/` to follow existing mapper convention — all mappers live under `persistence/prisma/mappers/`)
- [x] 2.3 Create `api/src/infrastructure/persistence/prisma/repositories/prisma-attachment.repository.ts` — PrismaAttachmentRepository implementing AttachmentRepository port (moved from `storage/` to follow existing repository convention)
- [x] 2.4 Create `api/src/application/attachments/dtos/upload-attachment.dto.ts` — Input: messageId, filename, mimeType, size (note: placed in `attachments/` not `storage/`)
- [x] 2.5 Create `api/src/application/attachments/dtos/attachment-response.dto.ts` — Response: id, filename, mimeType, size, url, messageId, uploadedAt
- [x] 2.6 Create `api/src/application/attachments/use-cases/upload-attachment.use-case.ts` — Verify sender, validate MIME/size, save file + DB
- [x] 2.7 Create `api/src/application/attachments/use-cases/get-attachment.use-case.ts` — Verify access (sender|recipient), return metadata
- [x] 2.8 Create `api/src/application/attachments/use-cases/delete-attachment.use-case.ts` — Verify sender, delete file + DB record

Criteria: LocalFileStorage rejects `../` in paths; access rules match design table; use cases use Result type

## Phase 3: Wiring + Web + Tests

- [x] 3.1 Create `api/src/presentation/attachments/attachments.controller.ts` — POST/GET/GET:download/DELETE with AuthGuard + multer (note: used `attachments/` not `storage/`, combined metadata + download into single GET)
- [x] 3.2 Create `api/src/presentation/attachments/attachments.module.ts` — NestJS module: providers for all use cases + adapters + controller (note: used `attachments/` not `storage/`)
- [x] 3.3 Modify `api/src/app.module.ts` — Import AttachmentsModule
- [x] 3.4 Modify `web/src/pages/compose.page.tsx` — Replace single input with textarea, comma-separated IDs → array on submit
- [x] 3.5 Create `api/src/__tests__/auth/jwt-auth-port.test.ts` — Sign/verify roundtrip, expired token, invalid signature, malformed token (7 tests)
- [x] 3.6 Create `api/src/__tests__/auth/auth-guard.test.ts` — Missing header → 401, invalid → 401, valid → attaches payload, role passthrough (7 tests)
- [x] 3.7 Create `api/src/__tests__/attachments/attachments.controller.test.ts` — Mock use cases; assert 201/200/204 for each endpoint, error mapping (9 tests)

Criteria: All endpoints return correct status codes per design spec; ComposePage sends `recipientIds` array with all entered IDs; infra tests pass with vitest
