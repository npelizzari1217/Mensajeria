# Apply Progress: adjuntos-file-storage — PR 3 (Final)

**Date**: 2026-05-13
**PR**: 3 of 3 (stacked-to-main)
**Focus**: AttachmentsController, StorageModule, AppModule wiring, ComposePage multiple recipients, infrastructure tests

## Completed Tasks (PR 1 + PR 2 + PR 3)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | FileId Value Object | ✅ PR1 | `shared/value-objects/file-id.ts` — UUID-based, `.create()` generates UUID, `.createFrom()` for validation, `.reconstruct()` for persistence |
| 1.2 | IFileStorage port | ✅ PR1 | `messaging/ports/file-storage.ts` — `upload`, `getUrl`, `delete`, `getPath` |
| 1.3 | Attachment domain entity | ✅ PR1 | `messaging/entities/attachment.ts` — `.create()` validates filename non-empty + size > 0, `.reconstruct()` skips validation. **PR2**: Added optional `fileId` param to `create()`, optional `storagePath` to `reconstruct()`/`AttachmentProps`, `getStoragePath()` accessor |
| 1.4 | AttachmentRepository port | ✅ PR1 | `messaging/repositories/attachment-repository.ts` — `save`, `findById`, `findByMessageId`, `delete` |
| 1.5 | Storage errors | ✅ PR2 | `shared/errors/storage-error.ts` — `StorageError extends DomainError` with `STORAGE_ERROR` code, supports `cause` for wrapped I/O errors |
| 1.6 | Domain index exports | ✅ PR1 | `FileId`, `Attachment`, `IFileStorage`, `AttachmentRepository` exported. **PR2**: Added `StorageError` |
| 1.7 | Prisma schema | ✅ PR1 | Attachment model added with `@map` conventions + `onDelete: Cascade`. Pre-existing schema bugs fixed |
| 1.8 | Migration | ✅ PR1 | SQL created at `prisma/migrations/20260513000001_add_attachment_model/migration.sql` |
| — | Domain tests | ✅ PR1 | 17 new tests: FileId.create/createFrom/reconstruct/equals, Attachment.create validation, Attachment.reconstruct, Attachment.equals |
| 2.1 | LocalFileStorage | ✅ PR2 | `api/src/infrastructure/storage/local-file-storage.ts` — Disk adapter. Path convention: `{basePath}/{fileId}/{filename}`. Anti-path-traversal via filename sanitisation. Configurable basePath (`./uploads/`) and baseUrl (`/v1/attachments/`). Implements IFileStorage fully |
| 2.2 | AttachmentMapper | ✅ PR2 | `api/src/infrastructure/persistence/prisma/mappers/attachment-mapper.ts` — `toDomain`: Prisma → domain Attachment via reconstruct. `toPrisma`: domain Attachment → Prisma create input (storagePath from entity) |
| 2.3 | PrismaAttachmentRepository | ✅ PR2 | `api/src/infrastructure/persistence/prisma/repositories/prisma-attachment.repository.ts` — Implements AttachmentRepository. Uses PrismaService + AttachmentMapper |
| 2.4 | UploadAttachmentDTO | ✅ PR2 | `api/src/application/attachments/dtos/upload-attachment.dto.ts` — messageId, filename, mimeType, size |
| 2.5 | AttachmentResponse | ✅ PR2 | `api/src/application/attachments/dtos/attachment-response.dto.ts` — id, filename, mimeType, size, url, messageId, uploadedAt |
| 2.6 | UploadAttachmentUseCase | ✅ PR2 | `api/src/application/attachments/use-cases/upload-attachment.use-case.ts` — Validates sender, MIME allowlist (images, PDF, DOCX, TXT), size ≤ 10MB. Calls IFileStorage.upload, creates Attachment entity with returned FileId, persists via repo. Rollback: cleans up file if DB save fails. Returns AttachmentResponse |
| 2.7 | GetAttachmentUseCase | ✅ PR2 | `api/src/application/attachments/use-cases/get-attachment.use-case.ts` — Finds attachment by FileId, verifies access (sender or recipient), returns metadata |
| 2.8 | DeleteAttachmentUseCase | ✅ PR2 | `api/src/application/attachments/use-cases/delete-attachment.use-case.ts` — Finds attachment, verifies sender-only, deletes file then DB record. Returns void on success |
| — | Use case tests | ✅ PR2 | 24 new tests across 3 files: upload (11 tests), get (6 tests), delete (7 tests) |
| 3.1 | AttachmentsController | ✅ PR3 | `api/src/presentation/attachments/attachments.controller.ts` — POST /messages/:id/attachments (multer), GET /attachments/:id (stream download), DELETE /attachments/:id. All AuthGuard-protected |
| 3.2 | AttachmentsModule | ✅ PR3 | `api/src/presentation/attachments/attachments.module.ts` — NestJS module wiring: controller, 3 use cases, LocalFileStorage, PrismaAttachmentRepository, DI tokens |
| 3.3 | AppModule wiring | ✅ PR3 | `api/src/app.module.ts` — Imported AttachmentsModule |
| 3.4 | ComposePage multi-recipient | ✅ PR3 | `web/src/pages/compose.page.tsx` — Changed single input to textarea with comma-separated UUIDs. Validation ensures at least one recipient. Sends `recipientIds: string[]` |
| 3.5 | JWT auth port tests | ✅ PR3 | `api/src/__tests__/auth/jwt-auth-port.test.ts` — 7 tests: sign/verify roundtrip, admin role, expired token, invalid signature, malformed token, empty string, two-part token |
| 3.6 | AuthGuard tests | ✅ PR3 | `api/src/__tests__/auth/auth-guard.test.ts` — 7 tests: no header, empty Bearer, non-Bearer scheme, invalid token, valid token allows, attaches user identity, passes through admin role |
| 3.7 | AttachmentsController tests | ✅ PR3 | `api/src/__tests__/attachments/attachments.controller.test.ts` — 9 tests: upload success, upload no file, upload domain error, download access, download unauthorized, download not found, delete success, delete error, delete not found |

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `api/src/presentation/attachments/attachments.controller.ts` | Created | REST controller: upload (POST, multer), download (GET, stream), delete (DELETE) |
| `api/src/presentation/attachments/attachments.module.ts` | Created | NestJS module wiring controller + use cases + adapters |
| `api/src/app.module.ts` | Modified | Imported AttachmentsModule |
| `web/src/pages/compose.page.tsx` | Modified | Single input → textarea for comma-separated recipient IDs |
| `api/src/__tests__/auth/jwt-auth-port.test.ts` | Created | 7 JWT sign/verify tests |
| `api/src/__tests__/auth/auth-guard.test.ts` | Created | 7 AuthGuard tests |
| `api/src/__tests__/attachments/attachments.controller.test.ts` | Created | 9 controller tests |

## Path Deviations

- **Controller + Module paths**: Design/tasks.md used `api/src/presentation/storage/`. Used `api/src/presentation/attachments/` instead, matching existing bounded-context packaging convention (`application/attachments/`).
- **Test paths for auth**: Design had `api/src/__tests__/infrastructure/jwt-auth-port.test.ts` and `api/src/__tests__/infrastructure/auth-guard.test.ts`. Used `api/src/__tests__/auth/` matching existing project convention for auth tests.
- **Controller test path**: Design had `api/src/__tests__/infrastructure/attachments.controller.test.ts`. Used `api/src/__tests__/attachments/attachments.controller.test.ts` where use case tests already live.
- **Download endpoint**: Design had separate metadata + download endpoints (`GET /attachments/:id` + `GET /attachments/:id/download`). Combined into single `GET /attachments/:id` that streams file content, per PR 3 task instruction.
- **Static files serving**: Did not add `ServeStaticModule` to main.ts — the controller handles download with access control (`@Res()` bypasses ResponseInterceptor for raw streaming).

## Deviations from Design

- The download handler directly reads from disk via `node:fs` in the controller layer rather than through IFileStorage (which lacks a `read` method). This is acceptable because the controller is in the HTTP/infrastructure layer and handles streaming concerns.
- The `LocalFileStorage` uses `getPath(fileId)` to resolve the filesystem directory, then the controller joins it with the filename from attachment metadata.

## Issues Found

- None.

## Test Results

```
# Domain (134 tests, all unchanged + passing)
Test Files  6 passed (6)
     Tests  134 passed (134)

# API (104 tests, 23 new + 81 existing)
Test Files  14 passed (14)
     Tests  104 passed (104)
```

All 238 tests passing. Ready for verify.

## Ready for Verify

✅ **Ready for Verify phase** — All 3 PRs complete. 238 total tests passing.

## Workload / PR Boundary

- Mode: stacked PR slice (final)
- Current work unit: Unit 3 — Controller, module, web UI, infrastructure tests
- Boundary: PR 3 completes the adjuntos-file-storage change
- Estimated review budget impact: ~350 lines added (controller + module + web + tests)
