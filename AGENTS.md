# AGENTS.md — estándares de revisión de mensajeria

> Este archivo lo consume la revisión automática de código. Este repo **no tenía un documento
> de estándares**, así que lo de abajo no se copió de ninguna guía: sale de la configuración
> real del monorepo y de convenciones que el propio código ya sostiene, verificadas al
> escribir este archivo. La procedencia de cada bloque está anotada.

## Arquitectura — el límite que importa

_(Procedencia: estructura real del repo, verificada el 2026-08-22)_

Arquitectura hexagonal, repartida así:

- `packages/domain` — dominio puro (`auth`, `messaging`, `role`, `shared`), con su propio
  Vitest.
- `api/src/application` — casos de uso, DTOs y **puertos** (`ports/`).
- `api/src/infrastructure` — adaptadores: Prisma, hashing, transporte.
- `api/src/presentation` — el borde HTTP y WebSocket.

Dos invariantes que hoy **se cumplen** (verificado: `rg` no devuelve ni una violación) y que
por eso valen como regla:

1. `packages/domain` **no importa `@nestjs/*` ni `@prisma/client`**. Ni uno.
2. `api/src/application` **no importa `@prisma/client`**. Habla con la persistencia por sus
   puertos (`application/*/ports/`), y el adaptador concreto vive en `infrastructure`.

Un import que cruce cualquiera de esas dos líneas es un hallazgo, aunque el código compile y
los tests pasen. Es la clase de rotura que no duele el día que se hace y bloquea el testeo
del dominio tres meses después.

## Lenguaje y tipos

_(Procedencia: `tsconfig.base.json` + reglas globales del autor)_

El `tsconfig.base.json` ya es estricto, y la revisión tiene que sostenerlo, no relajarlo:
`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`,
`isolatedModules`, `forceConsistentCasingInFileNames`.

- Comentarios de código en español. Los identificadores, nombres de archivo, mensajes de error y copy de UI siguen en inglés. No reportes comentarios en inglés preexistentes: solo los nuevos.
- **Prohibido `any`**, y prohibido `as any` para callar al compilador, también en tests.
  Para lo desconocido, `unknown` + validación con Zod.
- Parámetros y retornos de funciones exportadas, tipados explícitamente.
- SRP: funciones cortas, una responsabilidad. DRY: sin duplicación.
- Módulos ESM (`"module": "ESNext"`, `moduleResolution: bundler`).

## Validación y seguridad

_(Procedencia: dependencias declaradas en `api/package.json`)_

- Validación de entrada con **Zod**, en el borde. Un payload que entra al caso de uso sin
  pasar por un schema es un hallazgo.
- Contraseñas con **bcrypt**. Nunca en texto plano, nunca en un log, nunca en la respuesta.
- Auth con **JWT** (`jsonwebtoken`) + `cookie-parser`.
- **La autorización se decide en el backend.** Ocultar una acción en la UI no es un control
  de acceso.
- **Sin secretos en el código**: van por entorno, no se commitean.
- Este servicio expone **WebSockets** (`socket.io`): un gateway es una superficie de entrada
  igual que un controller HTTP. Si autentica y autoriza distinto que el borde HTTP, eso es un
  hallazgo, no un detalle de transporte.

## Errores

_(Procedencia: reglas globales del autor)_

- Todo bloque asíncrono y toda llamada a DB o API externa va protegida.
- **Cero excepciones vacías o silenciadas.** Un `catch` que solo loguea y sigue esconde el
  fallo hasta que se manifiesta en otro lado.
- Operaciones multi-tabla dentro de transacción, con rollback real.

## Tests

_(Procedencia: `api/package.json`, `packages/domain/vitest.config.ts` + reglas globales del autor)_

- Runner: **Vitest**. Package manager: **pnpm** (9). Node `>=20`. No hay Jest.
- Los tests de `api` viven en `api/src/__tests__`, organizados por área (`auth`, `messaging`,
  `attachments`, `e2e`). El dominio testea aparte, en `packages/domain`.
- Todo feature o bugfix no trivial ship con tests. Un bugfix lleva test de regresión que
  **falla antes del fix por la razón correcta** y pasa después.
- No generes tests exhaustivos ni combinatorios. Cubrí lógica de negocio, reglas de dominio y
  edge cases no obvios. Preferí tests parametrizados a funciones repetidas.
- Prohibido borrar o comentar tests para pasar en verde.
- Un test que consagra el comportamiento actual en vez del esperado no es cobertura: es un
  candado sobre el bug.

## Calidad — leé esto antes de reportar estilo

_(Procedencia: scripts reales de `package.json`, verificado el 2026-08-22)_

**Este repo no tiene ESLint ni Biome ni Prettier configurados.** No hay archivo de
configuración de linter en la raíz ni en `api`. El script `lint` de `api` es literalmente
`tsc --noEmit`: o sea, lint acá **significa typecheck**.

Consecuencia directa para la revisión: **no reportes formato, comillas, punto y coma, orden
de imports ni ancho de línea.** No hay herramienta que decida eso, así que un hallazgo de
estilo es una opinión, y opiniones de estilo sin herramienta detrás solo generan ruido.
Reportá lo que rompe tipos, comportamiento, seguridad o los límites de arquitectura.

Comandos: `pnpm build` · `pnpm test` · `pnpm lint` (los tres vía Turbo desde la raíz).

## Flujo de trabajo

_(Procedencia: `CLAUDE.md` del proyecto y práctica del repo)_

Proyecto de una sola persona: **no usa pull requests** ni revisor externo.

**No señales como problema**: la ausencia de PR, que un cambio supere N líneas, o que falte
un issue asociado.

Commits: **Conventional Commits**, en inglés (el historial del repo es en inglés), **sin
atribución de IA ni `Co-Authored-By`**.

## Documentación

_(Procedencia: reglas globales del autor)_

- JSDoc en toda función, método público o componente exportado: propósito, parámetros y
  retorno.
- Comentá el **porqué** de lo no trivial, nunca el **qué**.
- Un comentario que describe una intención que el código no cumple es peor que no tener
  comentario: se lee con confianza.
