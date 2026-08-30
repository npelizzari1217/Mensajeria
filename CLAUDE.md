# CLAUDE.md — mensajeria

> Las reglas universales (SDD, modelo por fase, commits, branch+PR, tests, código) están en
> `C:\trabajos\CLAUDE.md`. Este archivo contiene solo lo específico de este proyecto.

## [Overrides locales]

Todo lo que define `C:\trabajos\CLAUDE.md` aplica en este proyecto **sin anulaciones**.
Verificado el 2026-08-30.

Si en algún momento este proyecto se aparta del global, la anulación va acá y con este
formato — nunca como una regla suelta en otra sección:

- **ANULA:** `<regla global textual>` — **Motivo:** `<por qué acá no aplica>`
- **REEMPLAZA POR:** `<la regla que rige en este proyecto>`

---

## Qué es

App de mensajería con cliente **web** y **mobile**. Backend NestJS con soporte WebSocket
(socket.io) además del borde HTTP.

## Stack

pnpm workspaces (9) · Turbo · Node ≥ 20  
`packages/domain` — dominio puro  
`api` — NestJS + Prisma + bcrypt + JWT + socket.io  
`web` — cliente web  
`mobile` — cliente mobile  

TypeScript strict. Sin ESLint ni Biome: `pnpm lint` = `tsc --noEmit`.

## Arquitectura

Hexagonal:
- `packages/domain` — dominio puro (`auth`, `messaging`, `role`, `shared`)
- `api/src/application` — casos de uso, DTOs, puertos (`ports/`)
- `api/src/infrastructure` — adaptadores: Prisma, hashing, transporte
- `api/src/presentation` — borde HTTP y WebSocket

## WebSockets

El gateway socket.io es una superficie de entrada igual que un controller HTTP. Tiene que
autenticar y autorizar con las mismas reglas que el borde HTTP. Si difiere, es un hallazgo.

## Artefactos SDD

Los artefactos viven en `openspec/` y en `sdd/` (ambos commitados al repo).

## Comandos

`pnpm build` · `pnpm test` · `pnpm lint` (los tres vía Turbo desde la raíz)
