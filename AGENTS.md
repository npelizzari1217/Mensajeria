# AGENTS.md — estándares de revisión de mensajeria

> Este archivo lo consume la revisión automática de código (GGA), que lee **solo este
> archivo**: no puede abrir el `AGENTS.md` global. Por eso las reglas universales están
> copiadas acá abajo, entre los marcadores `BEGIN:global` / `END:global`, y las mantiene
> sincronizadas `sync-agents.py`. **No edites ese bloque a mano.**
>
> Lo que va **después** del bloque es lo propio de este proyecto: amplía al global, y ante
> conflicto **gana lo local**.
>
> Señalá solo lo accionable y apoyado en el diff. Esta revisión corre en `pre-commit`, sobre
> un commit suelto, antes de que exista el PR y sin conocer el resto de la rama: no reportes
> nada sobre el PR ni sobre el tamaño de la rama, porque no los podés ver.

<!-- BEGIN:global -->
<!-- Generado por sync-agents.py desde C:\trabajos\AGENTS.md (v96efe583).
     NO EDITAR A MANO: el proximo sync pisa los cambios.
     Para cambiar una regla universal, edita el global y volve a correr el script.
     Para que este proyecto se aparte, usa la seccion [Anulaciones] de mas abajo. -->

## Lenguaje y tipos

- **Todo lo que lee una persona va en español**: comentarios, prosa, copy de UI y
  **mensajes de error**. Solo quedan en inglés los **identificadores y nombres de archivo**
  (variables, funciones, clases, tipos, claves, rutas). El corte: si lo lee una persona,
  español; si lo lee el compilador, inglés.
- **La regla NO es retroactiva.** No reportes copy, mensajes de error ni comentarios en
  inglés preexistentes: **solo los nuevos**, y solo en las líneas que el diff agrega o
  reescribe. Un archivo con copy viejo en inglés no es un hallazgo.
- **Prohibido `any`**, los casts sin chequear y los `!` usados para callar al compilador.
  Para lo desconocido: `unknown` + validación.
- Los miembros exportados llevan tipos explícitos de parámetros y retorno.
- Sin variables ni parámetros declarados y no usados.

---

## Responsabilidad y duplicación

- Una responsabilidad por función. Señalá las funciones que mezclan transporte, reglas de
  negocio y persistencia en el mismo cuerpo.
- Sin lógica duplicada entre módulos. Señalá el copy-paste que debería estar en un lugar
  compartido.
- Los controllers se mantienen finos: parsean la entrada, delegan y mapean la respuesta. Las
  reglas de negocio y la persistencia viven en los services o casos de uso.

---

## Errores y seguridad

- Todo bloque asíncrono, query a la DB o llamada a API externa lleva manejo de errores.
  **Cero `catch` vacíos o que se tragan el error.** Un `catch` que solo loguea y sigue
  esconde el fallo hasta que se manifiesta en otro lado.
- Operaciones que tocan múltiples tablas relacionadas corren dentro de una transacción con
  rollback real.
- **Sin secrets, connection strings, tokens ni credenciales en el código.** Van en variables
  de entorno. Señalá cualquier línea de log que pueda imprimir un token o una respuesta
  completa de API que lo contenga.
- La autorización se decide en el backend. Ocultar una acción en la UI no es un control de
  acceso.
- Los valores que vienen del usuario se validan antes de usarlos. Un payload que entra a la
  lógica sin pasar por un schema o DTO es un hallazgo.

---

## Commits y Git

- Commits en **Conventional Commits, en español**.
- **`work-unit-commits`:** cada commit es un comportamiento entregable con sus tests adentro,
  reversible solo. Señalá un commit que mezcle implementación de features distintas o que
  deje la suite en rojo.
- Sin atribución de IA ni `Co-Authored-By` en los mensajes.

---

## Tests y TDD

Este proyecto trabaja con **TDD obligatorio**: el test se escribe antes que la
implementación, y `work-unit-commits` exige que ambos viajen en el mismo commit.

**Qué SÍ podés verificar desde acá.** Corrés en `pre-commit`, sobre un commit suelto, y
el commit **tiene que traer sus tests adentro**. Entonces:

- Un commit que agrega o cambia conducta y **no trae ningún test** es hallazgo.
- Un test cuyos asserts **describen la implementación** en vez de la conducta esperada
  (repite la fórmula del código, mockea justo lo que debía probar, afirma sobre detalles
  internos) es la firma de un test escrito *después*. Es hallazgo.
- Un test de regresión que **no podría haber fallado antes del fix** — porque su assert
  pasa por construcción, o el fixture no contiene el caso — es hallazgo.

**Qué NO podés verificar, y por lo tanto no reportes.** No viste correr la suite ni el
orden en que se escribieron los archivos. **No afirmes que el RED no se verificó**: no
tenés cómo saberlo. Limitate a lo que el diff muestra.

- Las features no triviales y todo bugfix van con tests. Un bugfix necesita un test de
  regresión que **falle antes del fix por la razón correcta** y pase después.
- Se cubren los caminos críticos y los edge cases (errores, límites, entradas inválidas),
  no solo el happy path.
- **Borrar o comentar tests para pasar en verde es hallazgo bloqueante.**
- Un test que consagra el comportamiento actual en vez del esperado no es cobertura: es un
  candado sobre el bug.
- No exigir tests exhaustivos ni combinatorios. Los getters triviales, los CRUD de paso y la
  validación que ya hace el framework no necesitan test propio.

---

## Documentación

- Las funciones exportadas, los métodos públicos y los componentes exportados llevan JSDoc
  o docstring con propósito, parámetros y retorno.
- Comentá el *porqué* de la lógica no obvia, nunca el *qué*.
- Toda dependencia, variable de entorno o comando de ejecución nuevo se refleja en el README
  y en el `.env.example` correspondiente en el mismo commit.

---

## Ruido conocido — no reportar

No rechaces un cambio por estas razones:

- **Formato, orden de imports, estilo de comillas, largo de línea.** De eso se encargan
  Prettier, ESLint o Biome según el proyecto. Si el proyecto no tiene linter configurado,
  no hay herramienta que decida el estilo: un hallazgo de formato sin herramienta detrás es
  una opinión.
- **Problemas preexistentes en código que el diff no toca.** Mencionarlos como nota a lo
  sumo, nunca como bloqueante.
- **Reescrituras arquitectónicas** de código que funciona cuando el diff es un fix acotado.
- **La falta de tests** en cambios que son puramente de configuración, comentarios o docs.
- **Preferencias subjetivas de nombres** cuando el nombre existente ya es claro.
- **Ceremonias de equipo** que no aplican a un proyecto de una sola persona: issue-first,
  labels de PR, aprobación de maintainer externo.

<!-- END:global -->

---

## Arquitectura — límites que no se cruzan

Dos invariantes verificados en el repo; un import que cruce cualquiera es un hallazgo
aunque el código compile y los tests pasen:

1. `packages/domain` **no importa `@nestjs/*` ni `@prisma/client`**. Ni uno.
2. `api/src/application` **no importa `@prisma/client`**. Habla con la persistencia por
   sus puertos (`application/*/ports/`); el adaptador concreto vive en `infrastructure`.

## WebSockets como superficie de entrada

Un gateway socket.io es una superficie de entrada igual que un controller HTTP. Si
autentica o autoriza distinto que el borde HTTP, es un hallazgo — no un detalle de
transporte.

## Calidad — qué reportar y qué no

Este repo **no tiene ESLint ni Biome**. `pnpm lint` = `tsc --noEmit`. **No reportes
formato, comillas, punto y coma, orden de imports ni ancho de línea**: no hay herramienta
que lo decida, así que es una opinión sin respaldo. Reportá lo que rompe tipos,
comportamiento, seguridad o los límites de arquitectura.

## Validación y seguridad

- Validación de entrada con **Zod** en el borde. Un payload que entra al caso de uso sin
  pasar por un schema es un hallazgo.
- Contraseñas con **bcrypt**. Nunca en texto plano, nunca en un log, nunca en la respuesta.
- Auth con **JWT** + `cookie-parser`. La autorización se decide en el backend; ocultar una
  acción en la UI no es un control de acceso.
- Sin secretos en el código: van por entorno, no se commitean.

## Ruido conocido de ESTE proyecto — no reportar

- Ausencia de issue asociado o etiquetas de PR: no aplica en este proyecto.
- No hay frontend hallazgos de estilo presentacional (sin Biome, sin ESLint).
