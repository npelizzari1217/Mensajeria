# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| creating, opening, or preparing PRs for review | branch-pr | /home/usuario/.config/opencode/skills/branch-pr/SKILL.md |
| PRs over 400 lines, stacked PRs, review slices | chained-pr | /home/usuario/.config/opencode/skills/chained-pr/SKILL.md |
| clean architecture, clean arch, capas, hexagonal, DDD, layers | clean-arch | /home/usuario/.config/opencode/skills/clean-arch/SKILL.md |
| writing guides, READMEs, RFCs, onboarding, architecture docs | cognitive-doc-design | /home/usuario/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| PR feedback, issue replies, reviews, Slack, GitHub comments | comment-writer | /home/usuario/.config/opencode/skills/comment-writer/SKILL.md |
| Expo, React Native, Tamagui, mobile, iOS, Android, cross-platform UI | expo-tamagui | /home/usuario/.config/opencode/skills/expo-tamagui/SKILL.md |
| Go tests, go test coverage, Bubbletea teatest, golden files | go-testing | /home/usuario/.config/opencode/skills/go-testing/SKILL.md |
| creating GitHub issues, bug reports, or feature requests | issue-creation | /home/usuario/.config/opencode/skills/issue-creation/SKILL.md |
| judgment day, dual review, adversarial review | judgment-day | /home/usuario/.config/opencode/skills/judgment-day/SKILL.md |
| NestJS, Nest, módulo, module, controller, DI, decorators | nestjs-modules | /home/usuario/.config/opencode/skills/nestjs-modules/SKILL.md |
| repository, repositorio, persistencia, data access, DAO, ORM, DB | repository-pattern | /home/usuario/.config/opencode/skills/repository-pattern/SKILL.md |
| value object, VO, tipos fuertes, domain primitive, self-validating | value-objects | /home/usuario/.config/opencode/skills/value-objects/SKILL.md |
| error handling, errores, Result type, manejo de errores | error-handling | /home/usuario/.config/opencode/skills/error-handling/SKILL.md |
| data access, online, offline, cache, sync, local DB, SQLite | data-access | /home/usuario/.config/opencode/skills/data-access/SKILL.md |
| auth, autenticación, autorización, access control, login, JWT, RBAC | auth-access | /home/usuario/.config/opencode/skills/auth-access/SKILL.md |
| API, REST, RESTful, endpoint, controller, route, HTTP, OpenAPI | api-design | /home/usuario/.config/opencode/skills/api-design/SKILL.md |
| email, push notification, websocket, SMS, real-time, chat | messaging-notifications | /home/usuario/.config/opencode/skills/messaging-notifications/SKILL.md |
| file, archivo, upload, S3, storage, file system, multimedia | file-storage | /home/usuario/.config/opencode/skills/file-storage/SKILL.md |
| audit, auditoría, historial, changelog, tracking, trail | audit-log | /home/usuario/.config/opencode/skills/audit-log/SKILL.md |
| UI, button, form, input, list, table, modal, dialog, component | ui-patterns | /home/usuario/.config/opencode/skills/ui-patterns/SKILL.md |
| report, PDF, boletin, factura, recibo, documento, pdf generation | reporting-documents | /home/usuario/.config/opencode/skills/reporting-documents/SKILL.md |
| schedule, calendar, agenda, appointment, time slot, recurring | scheduling-calendar | /home/usuario/.config/opencode/skills/scheduling-calendar/SKILL.md |
| Tauri, Tauri v2, desktop, escritorio, native, Rust, WebView | tauri-v2 | /home/usuario/.config/opencode/skills/tauri-v2/SKILL.md |
| new skills, agent instructions, documenting AI usage patterns | skill-creator | /home/usuario/.config/opencode/skills/skill-creator/SKILL.md |
| implementation, commit splitting, chained PRs, work units | work-unit-commits | /home/usuario/.config/opencode/skills/work-unit-commits/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### clean-arch
- Dependency Rule is NON-NEGOTIABLE: `domain/` imports nothing outside itself. `application/` imports domain only. `infrastructure/` imports domain + application only. `presentation/` imports application only.
- Entities: pure objects with identity + behavior. No getters/setters boilerplate. No anemic domain.
- VOs: immutable, self-validating, compared by value. One per meaningful primitive (Email, Money, UserId).
- Domain Events: plain objects, past tense (`OrderPlaced`). Repository interfaces defined in `domain/` as contracts.
- Use Cases: one class per use case. Single `execute()` or `invoke()` method. DTOs for layer boundaries.
- Infrastructure implements ports. Zero business logic — only technical wiring.
- Presentation translates HTTP/CLI input to DTOs, delegates to use cases. Zero business logic.
- DI is infrastructure concern. Constructor injection everywhere. No service locators.

### value-objects
- IMMUTABLE: `readonly` fields. No setters. No `mutate()`. Once created, never changes.
- Self-validating: validation inside the VO at construction time via factory (`static create()` returning `Result`).
- Compared by value: implement `equals()`. Same value = same object. No reference equality.
- No behavior unrelated to the value: `Money` can have `add()`, not `formatForDisplay()`.
- Every VO provides: `get()`/`value()`, `equals()`, `toString()`.
- Shared VOs (Email, Money, UserId) live in a shared package. No duplication across contexts.
- Primitive obsession is a code smell: `string` for email → `Email` VO. `number` for price → `Money` VO.

### repository-pattern
- Interface defined in `domain/`. Zero imports from infrastructure or ORM. Method names speak domain language.
- Implementation in `infrastructure/repositories/`. Maps ORM models to domain entities.
- ORM models are PRIVATE to infrastructure — never exported to domain or application.
- One repository per aggregate root (User, Order, Invoice), NOT per database table.
- `save()` is an upsert. No ORM types in domain (no `Prisma.UserWhereInput` leaking).
- Transactions are application concern — use case controls boundary, not repository.
- Read-only/denormalized data → QUERY interface in `application/`, NOT a repository.
- Test: mock interface for domain/app tests. Real DB for infrastructure tests.

### error-handling
- NEVER throw in domain or application layers — use `Result<T, E>` for all expected failures.
- Domain errors are part of domain model (`EmailInvalid`, `InsufficientFunds`). Defined alongside entities.
- Map errors at layer boundaries: infrastructure errors never cross into application. Application errors never cross into presentation as-is.
- Every `catch` MUST map or re-wrap. No bare `catch(e) { throw e }`.
- Error types carry context: what failed, why, relevant identifiers. No generic `Error('something went wrong')`.
- Log: infrastructure errors at ERROR level with full context. Application at WARN. Domain validation at DEBUG (expected).

### data-access
- One port, multiple strategies: same interface for DirectDB (backend), Remote (web), Cached (mobile).
- Backend: Prisma → PostgreSQL. Web: HTTP API calls. Mobile: expo-sqlite local + remote fallback + sync engine.
- Mappers transform between Prisma/SQLite rows and domain entities. VOs are canonical format.
- Reads NEVER blocked by connectivity (mobile): serve from cache, refresh in background.
- Writes in offline mode: queue locally with "pending" indicator. Process on reconnect.
- Conflict resolution: last-write-wins (default), server-wins (financial), manual-merge (complex edits).
- Cache invalidation: TTL-based, size-based, or explicit on mutation.
- Never cache passwords/tokens (secure storage), large media (file-storage), or data that MUST be fresh.

### auth-access
- AuthN (verification) ≠ AuthZ (permission check). Separate concerns.
- Auth providers are infrastructure (JWT, OAuth, Passport, Firebase). Define `AuthPort` in `application/`.
- Current user resolved at presentation boundary (middleware). Inject `UserIdentity` into use cases, never global/static.
- Authorization checks happen in APPLICATION, not infrastructure. Use cases check roles before executing.
- Role/permission logic lives in DOMAIN: `UserIdentity.hasRole()`, `Permission.can()` — not strings.
- Passwords: NEVER store plain-text. Hashing (bcrypt/argon2) in infrastructure. Validation rules in domain VO.
- Tokens: httpOnly + secure + sameSite cookies. JWTs: short expiry (15min access + 7d refresh). NEVER localStorage.

### api-design
- RESTful resource naming: NO verbs in URLs (`/getUsers` ✗). NO `/api` prefix unless behind gateway.
- Standard response envelope: `{ data: ... }` for success, `{ error: { code, message, details } }` for errors.
- HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401/403 Auth, 404 Not Found, 409 Conflict, 422 Business rule, 429 Rate limit, 500/503 Server errors.
- Never return 200 with `{ error: ... }`. Use correct status code.
- Two-level validation: transport (Zod schema in presentation) + domain (VO self-validation).
- Controllers are THIN: validate → call use case → map response. Zero business logic.
- Pagination: page=1, pageSize (max 100), sort=`field:direction`, filter=`field:value`.
- API versioning via URL prefix: `/v1/users`. Never remove a version without deprecation notice.

### messaging-notifications
- Each messaging channel has its OWN port: `EmailSenderPort`, `PushSenderPort`, `RealtimeMessengerPort`, etc. No monolithic `NotificationService`.
- Providers are infrastructure (SendGrid, SES, Firebase Push, Socket.IO). Application only knows ports.
- Templates live in infrastructure (`.hbs` files). Application references them by name + data.
- NEVER hardcode provider config in application code. Env vars read by infrastructure adapters.
- Transactional emails are fire-and-forget with retry — NEVER block the response. Queue + retry with backoff.
- Real-time messages are PERSISTED in DB. WebSocket is transport only — disconnects don't lose messages.
- Notification preferences (`NotificationPreference` VO) live in domain on the User entity.
- Security: never expose emails/phones in WS messages. Sanitize chat content. Store device tokens encrypted.

### file-storage
- NEVER store files as base64 in DB — DB for metadata only. Files go to disk/S3.
- `FileStoragePort` in application layer. Local disk and S3 are both implementations. Swap without touching business logic.
- Files are ASSOCIATED, not embedded: `student.fotoPerfil: FileId`, not `student.fotoPerfil: string`.
- Validate BEFORE storing: file type (MimeType VO), size, virus scan.
- Cleanup on entity deletion: domain event + handler calls `FileStoragePort.delete()`.
- Serve files through a controller — never expose raw storage paths. Check permissions.
- Sanitize filenames: remove path traversal (`../`), special chars. Rate-limit uploads.
- For large files (>10MB), use streams. Never buffer entirely in memory.

### audit-log
- Audit is a SIDE EFFECT, not primary logic. Failure NEVER blocks the operation. Log error and continue.
- Actor is ALWAYS required. Unknown = `actorType: 'system'`. Never null actor.
- Only log MEANINGFUL changes: skip null→null or undefined→undefined transitions. Structured `{field, oldValue, newValue}`.
- Audit entries are IMMUTABLE. Never update or delete. Correction = new entry saying "corrected field X from A to B".
- NEVER log passwords, tokens, or PII. Mask `@Sensitive` fields.
- Use domain events to trigger audit: use case emits event → handler records audit entry asynchronously.
- Audit logs grow fast: partition by month, separate table/collection from operational data. Archive >2 years to cold storage.
- Index on `(entityType, entityId, timestamp)` — primary query path.

### ui-patterns
- Data flow: User Action → DTO → Use Case → Result → UI Update. NO business logic in UI. NO direct API calls in components.
- Every data-fetching component handles 4 states: loading (skeleton), empty ("No hay registros" + action), error (alert + retry), success (data).
- Confirmation dialog for ALL destructive actions before executing.
- Form validation: schema-based (Zod). Submit → UseCase.execute() → Result → show field errors or success toast.
- Select with DB options: fetch async, show skeleton, allow search when >10 options.
- Modal types: FormModal (create/edit), ConfirmDialog (destructive), DetailDrawer (quick view), FullScreenModal (complex forms).
- Button types: Primary (main action), Secondary (cancel/back), Danger (destructive + confirmation), Ghost (table actions), Link (navigation).

### expo-tamagui
- One source of truth for design tokens: all colors, spacing, typography, and breakpoints in `tamagui/config.ts`. Never hardcode.
- Theme-aware components: use `useTheme()` or `styled()` with theme tokens. No platform-specific color checks.
- Responsive by default: use Tamagui's responsive props (`$gtSm`, `$gtMd`). Avoid separate mobile/tablet/desktop components.
- No inline styles. Extract to `styled()`. No `useWindowDimensions()` — use `useMedia()`.
- One component per file. Name matches export.
- Primitives (`ui/Button`) are pure `styled()`. Feature components compose primitives. Screens compose feature components.
- Domain types from shared package (`@compartido/dominio`). NOT redefined in Expo. Reuse VO validation on client.
- Expo Router (`app/` directory). File-based routing. Route groups for layout nesting.

### nestjs-modules
- Controllers in `presentation/`. Use cases are plain classes in `application/` (no `@Injectable()` needed). Repository implementations in `infrastructure/`.
- No `@Injectable()` in domain. Domain entities/VOs are pure classes. Zero NestJS decorators.
- Repository injection uses Symbol tokens (`export const USERS_REPOSITORY = Symbol(...)`) to keep domain free of NestJS imports.
- Modules are wiring: `@Module({ controllers: [...], providers: [...] })`. Never put business logic in modules.
- Controllers are thin: parse → call use case → respond. Use cases are plain classes with `execute()`.
- Cross-module use cases: export in `exports: []` of source module. Import that module where needed.
- Circular imports = design smell. Extract shared dependency into a new module.
- Test: controllers with `@nestjs/testing` + mocks. Use cases as plain classes. Infrastructure with real DB + testcontainers.

### branch-pr
- Every PR MUST link an approved issue — no exceptions.
- Every PR MUST have exactly one `type:*` label.
- Automated checks must pass before merge.
- Blank PRs without issue linkage blocked by GitHub Actions.

### chained-pr
- Split PRs over 400 changed lines. Keep each PR reviewable in ≤60 minutes.
- State start, end, prior deps, follow-up, and out-of-scope in every chained PR.
- Every child PR includes a dependency diagram marking current PR with `📍`.
- Feature Branch Chain: create draft tracker PR. Child #1 targets tracker branch. Later children target parent branch.
- Fix polluted diffs: retarget or rebase until only current work unit appears.

### cognitive-doc-design
- Lead with the answer: decision/action/outcome FIRST. Context after.
- Progressive disclosure: happy path first, then details, edge cases, references.
- Chunking: group related info in small sections. Keep flat lists short.
- Signposting: use headings, labels, callouts, summaries.
- Recognition over recall: tables, checklists, examples, templates over prose.
- Review empathy: design docs so reviewers can verify intent without reconstructing the whole story.

### comment-writer
- Be useful fast: start with actionable point. Don't recap the whole PR.
- Be warm and direct: sound like a thoughtful teammate, not a corporate bot.
- Keep it short: 1-3 paragraphs or a tight bullet list.
- Explain WHY when asking for a change. Give technical reason.
- Avoid pile-ons: comment on highest-value issue, not every tiny preference.
- Match thread language: Spanish → Rioplatense voseo (`podés`, `tenés`, `fijate`, `dale`).

### go-testing
- Prefer table-driven tests with `t.Run(tt.name, ...)`. Test behavior, not implementation.
- Use `t.TempDir()` for filesystem tests. Never rely on real home directory.
- Keep integration tests skippable with `testing.Short()`.
- Bubbletea: test `Model.Update()` directly. Use `teatest` only for interactive flows.
- Golden files: deterministic only. Update via repo's `-update` path. Rerun without `-update`.

### issue-creation
- Blank issues disabled — MUST use template (bug report or feature request).
- Every issue gets `status:needs-review` on creation.
- Maintainer MUST add `status:approved` before any PR can be opened.
- Questions go to Discussions, not issues.

### judgment-day
- Launch two blind judges in parallel. Never review code yourself.
- Wait for BOTH judges before synthesis. Never accept partial verdict.
- Classify warnings: `WARNING (real)` only if normal intended use triggers it. Otherwise `INFO` / `WARNING (theoretical)`.
- After fix agent runs, immediately re-launch both judges before commit/push/done.
- Terminal states: `JUDGMENT: APPROVED` or `JUDGMENT: ESCALATED`.
- After 2 fix iterations with remaining issues, ask user whether to continue.

### reporting-documents
- Three-layer: Data aggregation (application use case) → Template + render (infrastructure) → Output + storage (infrastructure).
- Document port in application: `DocumentRendererPort.render(template, data)`.
- Templates are infrastructure files (HTML/CSS, Handlebars, PDF lib). Application references by name.
- Document output stored via `FileStoragePort` (file-storage skill). Never return raw binary from use cases.
- Complex documents (odontograms, production orders) use domain data from multiple repositories aggregated by use case.
- Always include: generation timestamp, version, and who generated it in document metadata.

### scheduling-calendar
- Domain model: `Appointment` with `entityType` (polymorphic — works for any domain: medical, school, manufacturing, invoicing).
- TimeSlot is a Value Object with `start`, `end`, `duration`. Validate: end > start, no overlap for same resource.
- Conflict detection is DOMAIN logic: `SchedulerService.canSchedule(appointment, existingAppointments)`.
- Availability = time slots that are within working hours AND not already booked. Computed in application layer.
- Recurring appointments: store base + recurrence rule (RRULE-style). Expand on query within a date range.
- Appointment status lifecycle: `scheduled → confirmed → in_progress → completed | cancelled | no_show`.
- Notifications (reminder, confirmation, cancellation) fire via domain events, handled by messaging-notifications port.

### tauri-v2
- Web app is the UI. Tauri is the native shell. Build web app first, wrap with Tauri.
- Rust backend in `/src-tauri/`. Commands in `#[tauri::command]` handlers.
- Tauri v2 capabilities in `src-tauri/capabilities/`. Permissions are explicit.
- Use Tauri plugins for native features (file dialog, notification, shell, fs).
- Tray and native menu are optional Rust-side features. Web app communicates via events.
- Build web app to `web-dist/` (or similar). Tauri dev serves web dev server. Tauri build bundles static files.
- Cross-platform: same codebase builds for Windows (.msi), macOS (.dmg), Linux (.deb/.AppImage).

### work-unit-commits
- Commit by work unit: each commit = one deliverable behavior, fix, migration, or docs unit.
- Do NOT commit by file type: no "models then services then tests" if none works alone.
- Keep tests with the code they verify — same commit.
- Keep docs with the user-visible change — same commit.
- Tell a story: reviewer should understand WHY each commit exists from diff + message.
- SDD tasks map 1:1 to work units. One task = one commit (or one PR in a chain).

### skill-creator
- A skill is a runtime instruction contract for an LLM, not human documentation.
- Required structure: frontmatter, Activation Contract, Hard Rules, Decision Gates, Execution Steps, Output Contract, References.
- Keep description quoted, one physical line, trigger-first, ≤250 chars.
- Target 180-450 body tokens. Move examples/schemas to local `references/` or `assets/`.
- References must be local files, stable relative to skill directory.

## Project Conventions

No project convention files found (greenfield project). Run `/sdd-propose` or `/sdd-explore` to establish initial conventions.

## Project Skills

No project-level skills found (greenfield project). Consider creating project-specific skills via `skill-creator` once conventions are established.
