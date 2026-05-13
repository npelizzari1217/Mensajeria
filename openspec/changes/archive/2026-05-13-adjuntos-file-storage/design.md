# Design: adjuntos-file-storage

## Technical Approach

Extend Clean Architecture with a `FileStorage` port (domain) + `LocalFileStorage` adapter (infrastructure). Add `Attachment` Prisma model with direct FK to `Message`. Three use cases (upload, get, delete) with access control. Web ComposePage changes textarea to comma-separated recipient IDs. Infrastructure tests for JWT, AuthGuard, and controller status codes.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **FileStorage in domain vs application** | Domain keeps infra abstraction pure; application layer is for orchestration | **Domain** — follows EventBus pattern |
| **Direct FK vs join table** for Attachment→Message | Join table adds query complexity; an attachment always belongs to 1 message | **Direct FK** (`messageId` on Attachment) |
| **Attachment domain entity?** | Full entity keeps architectural purity but adds ~60 lines of boilerplate for a data record | **Yes, minimal** — reconstruct-only, no business methods. Follows existing pattern |
| **Download via controller vs static files** | Static files are simpler but skip access control | **Controller** — verify sender/recipient access first |
| **ComposePage multi-recipient** | Textarea simplest; multi-select requires user search API | **Textarea** — one UUID per line, split on submit; iterable in v2 |

## Data Flow

```
Upload:
  Client → POST /messages/:id/attachments (multipart)
    → AuthGuard (JWT verify)
    → AttachmentsController.upload
    → UploadAttachmentUseCase
      → MessageRepository.findById (verify message + sender)
      → IFileStorage.upload(buffer, safeName, mimeType)
      → AttachmentRepository.save(Attachment)
    → 201 { data: { id, fileName, mimeType, size, messageId, createdAt } }

Download:
  Client → GET /attachments/:id/download
    → AuthGuard
    → AttachmentsController.download
    → GetAttachmentUseCase
      → AttachmentRepository.findById
      → MessageRepository.findById (verify access: sender or recipient)
      → IFileStorage.read(fileId)
    → 200 stream (Content-Type, Content-Disposition: attachment)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/domain/src/storage/file-id.ts` | Create | UUID-based FileId VO |
| `packages/domain/src/storage/file-storage.ts` | Create | IFileStorage port: upload, read, getUrl, delete |
| `packages/domain/src/storage/entities/attachment.ts` | Create | Minimal Attachment entity (reconstruct-only) |
| `packages/domain/src/storage/repositories/attachment.repository.ts` | Create | AttachmentRepository port: save, findById, delete |
| `packages/domain/src/storage/errors/storage.errors.ts` | Create | AttachmentNotFoundError |
| `packages/domain/src/index.ts` | Modify | Export new types |
| `api/prisma/schema.prisma` | Modify | Add Attachment model |
| `api/src/infrastructure/storage/local-file-storage.ts` | Create | LocalFileStorage adapter |
| `api/src/infrastructure/storage/attachment.mapper.ts` | Create | Prisma ↔ Attachment mapper |
| `api/src/infrastructure/storage/prisma-attachment.repository.ts` | Create | PrismaAttachmentRepository |
| `api/src/application/storage/dtos/upload-attachment.dto.ts` | Create | Input DTO |
| `api/src/application/storage/dtos/attachment-response.dto.ts` | Create | Response DTO |
| `api/src/application/storage/use-cases/upload-attachment.use-case.ts` | Create | Upload use case |
| `api/src/application/storage/use-cases/get-attachment.use-case.ts` | Create | Get metadata + download use case |
| `api/src/application/storage/use-cases/delete-attachment.use-case.ts` | Create | Delete use case |
| `api/src/presentation/storage/attachments.controller.ts` | Create | REST controller |
| `api/src/presentation/storage/storage.module.ts` | Create | NestJS module wiring |
| `api/src/app.module.ts` | Modify | Import StorageModule |
| `web/src/pages/compose.page.tsx` | Modify | Multi-recipient textarea |
| `api/src/__tests__/infrastructure/jwt-auth-port.test.ts` | Create | JWT sign/verify roundtrip |
| `api/src/__tests__/infrastructure/auth-guard.test.ts` | Create | Guard rejection/acceptance |
| `api/src/__tests__/infrastructure/attachments.controller.test.ts` | Create | Controller status codes |

## Interfaces / Contracts

### IFileStorage (domain)
```typescript
export interface IFileStorage {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<FileId>;
  read(fileId: FileId): Promise<Buffer>;
  getUrl(fileId: FileId): string;
  delete(fileId: FileId): Promise<void>;
}
```

### Prisma Attachment
```prisma
model Attachment {
  id           String   @id @default(uuid()) @map("attachment_id")
  fileName     String   @map("file_name")
  mimeType     String   @map("mime_type")
  size         Int
  storagePath  String   @map("storage_path")
  messageId    String   @map("message_id")
  message      Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  uploadedById String   @map("uploaded_by_id")
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([messageId])
  @@index([uploadedById])
  @@map("attachments")
}
```

### LocalFileStorage rules
- **Root**: `uploads/` at project root
- **Path**: `uploads/{YYYY}/{MM}/{DD}/{uuid}.{ext}`
- **Naming**: `crypto.randomUUID()` preserves original extension from sanitized filename
- **Traversal prevention**: strip `../` and `..\\` from user-provided filename; the stored path is always generated, never user-controlled
- **Max file size**: 10MB (configurable via STORAGE_MAX_FILE_SIZE env var)

### Endpoints
| Method | Route | Auth | Status | Description |
|--------|-------|------|--------|-------------|
| POST | `/messages/:messageId/attachments` | AuthGuard | 201 | Upload (multipart/form-data, field: `file`) |
| GET | `/attachments/:id` | AuthGuard | 200 | Metadata |
| GET | `/attachments/:id/download` | AuthGuard | 200 | File stream |
| DELETE | `/attachments/:id` | AuthGuard | 204 | Delete |

### Use case validation rules
- **Upload**: message exists AND user is sender → allow; MIME in allowlist; size ≤ max
- **Get/Download**: attachment exists AND user is sender or recipient of parent message → allow
- **Delete**: attachment exists AND user is sender of parent message → allow

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | JwtAuthPort sign/verify roundtrip | Instantiate with test secret, sign payload, verify, assert payload matches |
| Unit | AuthGuard | Mock AuthPort. Test: missing header → 401, invalid token → 401, valid token → attaches `{ userId, role }` to request |
| Unit | AttachmentsController | Mock use cases. Assert: upload returns 201, get returns 200, download returns 200+stream, delete returns 204, errors map to correct status codes |
| Unit | UploadAttachmentUseCase | Mock repos + FileStorage. Assert: valid upload saves file + DB record, invalid MIME returns error, oversized returns error, non-sender returns 403 |

## Dependencies and Ordering

1. **Domain**: FileId VO → IFileStorage port → Attachment entity → AttachmentRepository port → errors (all independent per-file)
2. **Prisma schema**: depends on Message model existing (add Attachment model, then `prisma migrate dev`)
3. **Infrastructure**: LocalFileStorage (depends on IFileStorage, FileId) → PrismaAttachmentRepository + mapper (depends on Attachment entity)
4. **Application**: use cases (depend on IFileStorage + AttachmentRepository + MessageRepository)
5. **Presentation**: controller (depends on use cases) → module (wires providers)
6. **Web**: ComposePage (independent, changes recipient input only)

## Open Questions

- [ ] MIME allowlist: define exact list or make it configurable via env var?
- [ ] Should upload use case emit a domain event (AttachmentUploaded) for future async processing?
