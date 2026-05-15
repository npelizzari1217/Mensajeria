# Apply Progress: entrega-4-final

## Overall Status

| PR | Status | What |
|----|--------|------|
| PR1 — Fixes | ✅ Complete | turbo.json pipeline→tasks. N+1 y void event ya estaban fixeados |
| PR2 — Groups | ✅ Complete | Domain (Group, GroupMember, GroupRole, errors, events, repo port, tests), Infra (Prisma schema, migration, mapper, repo), App (9 use cases), API (controller + module + app module wiring) |
| PR3 — Drafts | ✅ Complete | Domain (Draft entity, DraftRepository, errors, exports, 12 tests), Infra (Prisma schema, migration, mapper, repo), App (6 use cases), API (controller, module), Web (list page, edit page, route, nav link, save button in Compose) |
| PR4 — Forward | ✅ Complete | ForwardedContent VO, ForwardMessageUseCase, POST /v1/messages/:id/forward |
| PR5 — Pinned | ✅ Complete | UserPinnedMessage model, pin/unpin/list use cases, API + Web + DetailPage button |
| PR6 — Export | ✅ Complete | ExportThreadUseCase, GET /v1/messages/:id/thread/export |
| PR7 — Mobile | ⏳ Pending | |
| PR8 — Push | ⏳ Pending | |

---

## PR 1: Fixes Técnicos — ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| 1.1 get-thread N+1 | ✅ Pre-fixed | Commit `cd422a7` ya usaba getters |
| 1.2 get-message N+1 | ✅ Pre-fixed | Commit `cd422a7` ya usaba getters |
| 1.3 reply-to-message void event | ✅ Pre-fixed | Commit `d309876` ya wireó EventBus |
| 1.4 turbo.json pipeline→tasks | ✅ Fixed | Renombrado. Turbo corre OK |
| 1.5 Tests | ✅ Pasando | 158 domain tests + API compila |

### Files Changed
- `turbo.json` — `pipeline` → `tasks`

---

## PR 2: Groups — ✅ Complete (Domain + API + Web)

### Domain (8 files)
| File | Action |
|------|--------|
| `packages/domain/src/messaging/value-objects/group-role.ts` | Created — GroupRole VO |
| `packages/domain/src/messaging/entities/group.ts` | Created — Group aggregate root |
| `packages/domain/src/messaging/entities/group-member.ts` | Created — GroupMember entity |
| `packages/domain/src/messaging/repositories/group-repository.ts` | Created — port |
| `packages/domain/src/messaging/errors/group.errors.ts` | Created — 4 domain errors |
| `packages/domain/src/messaging/events/group-created.ts` | Created |
| `packages/domain/src/messaging/events/group-member-added.ts` | Created |
| `packages/domain/src/messaging/events/group-member-removed.ts` | Created |
| `packages/domain/src/index.ts` | Modified — exports grupos |
| `packages/domain/src/__tests__/group.test.ts` | Created — 18 tests |
| `packages/domain/src/__tests__/group-role.test.ts` | Created — 6 tests |

### Infrastructure (3 files)
| File | Action |
|------|--------|
| `api/prisma/schema.prisma` | Modified — Group, GroupMember, GroupRole enum |
| `api/src/infrastructure/persistence/prisma/mappers/group-mapper.ts` | Created |
| `api/src/infrastructure/persistence/prisma/repositories/prisma-group.repository.ts` | Created |

### Application (9 use cases + DTOs)
| File | Action |
|------|--------|
| `api/src/application/groups/dtos/create-group.dto.ts` | Created — DTOs + responses |
| `api/src/application/groups/use-cases/create-group.use-case.ts` | Created |
| `api/src/application/groups/use-cases/update-group.use-case.ts` | Created |
| `api/src/application/groups/use-cases/deactivate-group.use-case.ts` | Created |
| `api/src/application/groups/use-cases/add-group-member.use-case.ts` | Created |
| `api/src/application/groups/use-cases/remove-group-member.use-case.ts` | Created |
| `api/src/application/groups/use-cases/change-member-role.use-case.ts` | Created |
| `api/src/application/groups/use-cases/list-user-groups.use-case.ts` | Created |
| `api/src/application/groups/use-cases/get-group-detail.use-case.ts` | Created |
| `api/src/application/groups/use-cases/resolve-group-recipients.use-case.ts` | Created |

### Presentation (3 files)
| File | Action |
|------|--------|
| `api/src/presentation/groups/groups.controller.ts` | Created — 8 endpoints |
| `api/src/presentation/groups/groups.module.ts` | Created |
| `api/src/app.module.ts` | Modified — GroupsModule importado |

### Web UI (✅ completado)
| File | Action |
|------|--------|
| `web/src/api/groups.ts` | Created — helper functions for groups API |
| `web/src/pages/groups/index.page.tsx` | Created — list + create group |
| `web/src/pages/groups/detail.page.tsx` | Created — detail + members + manage |
| `web/src/App.tsx` | Modified — routes for `/groups` y `/groups/:id` |
| `web/src/components/layout.tsx` | Modified — nav link "Grupos" |
| `web/src/pages/compose.page.tsx` | Modified — group selector dropdown |
| `web/src/styles.css` | Modified — group list, card, utility styles |

### Tests
- 158 tests pasando (134 old + 24 new)
- API compila sin errores
- Prisma generate exitoso

---

**¿Continuamos con PR3 (Drafts)?** El dominio de Groups está completo con API lista. Faltan las páginas web de groups y el selector en compose, pero la base de API está servida para que mobile pueda consumir grupos desde ahora.
