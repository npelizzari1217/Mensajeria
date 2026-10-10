# CLAUDE.md — mensajeria

> Las reglas universales (flujo de trabajo ODD, persistencia, commits, rama+PR, TDD,
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

El trabajo nuevo (desde el 2026-10-10) sigue ODD: un documento `odd/tasks/<feature>.md` con
su espejo en engram (§3.3 y §6 de `~/proyectos/CLAUDE.md`). `openspec/` es historia
congelada de solo lectura. Hasta el 2026-09-08 este repo tenía además un `sdd/` en la raíz
con 5 cambios; se eliminó para que los ciclos vivieran en un solo lugar. Esos artefactos
siguen en la historia de git: `git show be2e7e1~1:sdd/`.

Ciclos heredados de SDD, anotados el 2026-10-10 (no se tocó nada bajo `openspec/changes/`):

- `mobile-app` (34/34) y `fix-select-empresa-role-premium-ui` (12/12): terminados, CERRADOS
  sin archive formal por decisión del dueño.
- `entrega-4-final`: PR1-6 hechos, PR7 y PR8 pendientes. Queda como está y se retoma bajo
  ODD si alguna vez hace falta.
