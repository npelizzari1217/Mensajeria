# CLAUDE.md — mensajeria

> Las reglas universales (SDD, tabla de modelos, persistencia, commits, rama+PR, TDD,
> delegación, estándares de código) están en `~/proyectos/CLAUDE.md`. Este archivo contiene
> solo lo específico de este proyecto.

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

## Comandos

`pnpm build` · `pnpm test` · `pnpm lint` (los tres vía Turbo desde la raíz)

---

## Dónde vive el historial de decisiones

Además del `openspec/` que pide el global, este repo tiene un `sdd/` con artefactos
commiteados. Los dos viajan con el repo; si buscás una decisión vieja y no está en
`openspec/changes/`, mirá `sdd/`.
