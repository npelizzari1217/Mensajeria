---
title: "Proposal: adjuntos-file-storage"
change: adjuntos-file-storage
phase: propose
artifact: proposal
status: draft
---

# Proposal: adjuntos-file-storage

## Intent

Habilitar adjuntos en mensajes (Entrega 2 del roadmap). Agregar FileStorage port + adapter local, schema de attachments, endpoints de subida/descarga, y cerrar deuda técnica de tests de infraestructura. Aprovechar que el schema ya soporta múltiples destinatarios para actualizar también la UI web.

## Scope

### In Scope
- **FileStorage port** (`IFileStorage` en `packages/domain/`) — `upload(file): FileId`, `getUrl(fileId): string`, `delete(fileId): void`
- **Prisma migration** — modelos `Attachment` + `MessageAttachment`, migración generada
- **Adapter local** (`LocalFileStorage` en `api/src/infrastructure/`) — almacenamiento en disco con uploads/
- **Use cases**: `UploadAttachment`, `GetAttachment`, `DeleteAttachment`
- **REST endpoints**: `POST /messages/:id/attachments`, `GET /attachments/:id`, `GET /attachments/:id/download`, `DELETE /attachments/:id`
- **Multiple recipients web UI** — ComposePage: input único → multi-select o lista de IDs separados por coma
- **Infrastructure tests** — AuthGuard, RolesGuard, controllers (auth + messaging), JWT sign/verify

### Out of Scope
- S3/cloud storage — local FS only
- Thumbnail generation / image preview
- File type validation beyond MIME check
- Drag-and-drop upload UI — `<input type="file">` suficiente para v1
- Full-text search en attachments

## Capabilities

### New Capabilities
- `file-attachments`: subir, listar, descargar y eliminar archivos adjuntos a mensajes

### Modified Capabilities
- `messaging-core`: los mensajes ahora pueden tener attachments (requisitos de listado/detalle cambian)

## Approach

1. **FileStorage port** en `packages/domain/src/storage/` — interfaz pura, sin dependencias externas. `upload(buffer, name, mimeType)` → `FileId` (UUID). `getUrl(id)` → path local.
2. **Prisma**: modelo `Attachment { id, fileName, mimeType, size, storagePath, uploadedById, createdAt }` + `MessageAttachment { messageId, attachmentId }`.
3. **LocalFileStorage** escribe a `uploads/` con subdirectorios por fecha. El path se guarda en DB.
4. **Upload endpoint** recibe `multipart/form-data`, valida MIME contra allowlist, llama al use case, persiste en DB.
5. **Download endpoint** busca el attachment, verifica acceso (sender/recipient), streamea el archivo.
6. **ComposePage** cambia input único a textarea para múltiples IDs separados por coma, envía array.
7. **Infrastructure tests** se agregan como test unitarios de Nest (TestingModule) para guard, controller, JWT.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/domain/src/storage/` | New | IFileStorage port, FileId VO |
| `packages/domain/src/index.ts` | Modified | Exportar nuevos tipos |
| `api/prisma/schema.prisma` | Modified | Attachment + MessageAttachment |
| `api/src/infrastructure/storage/` | New | LocalFileStorage adapter |
| `api/src/application/storage/` | New | Use cases + DTOs |
| `api/src/presentation/storage/` | New | AttachmentsController + module |
| `api/src/app.module.ts` | Modified | Import StorageModule |
| `web/src/pages/compose.page.tsx` | Modified | Multi-recipient input |
| `api/src/__tests__/` | New | Infrastructure tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Disk space exhaustion from uploads | Low | Limit file size (configurable, ~10MB default), periodic cleanup |
| Path traversal in file serving | Low | UUID-based filenames, storage path nunca expuesto al cliente |
| Existing messages lack attachment support in detail response | Low | Response DTO incluye `attachments: []` por defecto |

## Rollback Plan

- FileStorage port: no tiene side effects fuera de implementación — revertir si rompe contract
- Prisma migration: `prisma migrate down` o revertir commit de schema
- Endpoints: eliminar controlador + módulo, revertir app.module.ts
- Web: revertir ComposePage a input único
- Tests: solo código agregado, sin rollback necesario

## Dependencies

- Node.js `fs/promises` (built-in) — zero external deps para LocalFileStorage
- `multer` para file upload en NestJS (o `@nestjs/platform-express` ya incluido)

## Success Criteria

- [ ] POST /messages/:id/attachments con archivo → 201 + FileId
- [ ] GET /attachments/:id retorna metadata del archivo
- [ ] GET /attachments/:id/download descarga el contenido
- [ ] DELETE /attachments/:id elimina archivo y registro
- [ ] Usuario sin acceso al mensaje → 403 al intentar descargar attachment
- [ ] ComposePage envía a múltiples destinatarios correctamente
- [ ] Infrastructure tests: AuthGuard, RolesGuard, controllers pasan
- [ ] Tests existentes (174) siguen pasando
