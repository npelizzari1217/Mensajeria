# CLAUDE.md — mensajeria

## SDD

Este repo trabaja con Spec-Driven Development: los artefactos viven en `openspec/` y en
`sdd/`. Cada fase la ejecuta su subagente dedicado vía la herramienta Agent, **nunca
invocando la skill** (las `sdd-*/SKILL.md` traen `delegate_only: true`: si las cargás como
skill, sos el orquestador y tenés que delegar igual). El `model` es obligatorio en cada
llamada.

### Cuándo NO corresponde el ciclo completo

Se implementa directo, sin ciclo SDD, **solo** si es un cambio mecánico de un archivo ya
entendido, **sin diseño pendiente**. En ese caso lo hace el orquestador.

Contar archivos NO es el criterio: un solo guard de dominio puede romper la capa que lo
espeja, y el cambio se ve trivial hasta que alguien lo usa. Antes de arrancar, tres
preguntas de sí/no:

1. ¿Cambia algo que otra capa espeja? (un guard de dominio, un enum, un contrato de error,
   un permiso, un schema del front)
2. ¿Hay más de una forma razonable de hacerlo?
3. ¿Cambia lo que el usuario ve o hace? (una pantalla, un flujo, el significado de un estado)

**Un solo sí → ciclo SDD completo. Tres noes → lo hace el orquestador.**

Ante la duda, SDD. El costo es asimétrico: equivocarse hacia "directo" cuando había una
decisión escondida cuesta un ciclo de retrabajo; equivocarse hacia SDD en algo mecánico
cuesta un rato.

### Modelo por fase

| Fase | Agente | Modelo |
|---|---|---|
| explore | `sdd-explore` | sonnet |
| propose | `sdd-propose` | **opus** |
| spec | `sdd-spec` | sonnet |
| design | `sdd-design` | **opus** |
| tasks | `sdd-tasks` | **opus** |
| apply | `sdd-apply` | sonnet |
| verify | `sdd-verify` | **opus** |
| archive | `sdd-archive` | sonnet |

### Por qué cada fase corre donde corre (revisión 2026-08-22)

Tres fases cambiaron de modelo. El fundamento sale de revisar dónde aparecieron los
defectos en los ciclos ya archivados, no de una preferencia.

| Fase | Modelo | Cambio | Por qué |
|---|---|---|---|
| explore | sonnet | — | Define el mapa que heredan las fases siguientes. Sin fallos atribuidos. |
| propose | opus | — | Fase supervisada por vos; se sostiene sola. Candidata a bajar si necesitás presupuesto. |
| spec | sonnet | — | Sin fallos atribuidos todavía. Pendiente de confirmar si los huecos de `tasks` son de diseño o de requisito no escrito. |
| design | opus | — | Razona bien. Lo que falla es la estimación (~3×) y la rotura colateral. Se arregla obligándolo a correr typecheck real, no subiendo modelo. |
| tasks | sonnet → opus | ⬆ | Último punto donde un hueco de design cuesta minutos. El único pase que atrapó CRÍTICOS corrió en opus. Evidencia n=1: aplicar, pero no darlo por medido. |
| apply | sonnet | — | Su falla (implementación antes del test en archivos grandes) es de disciplina, no de capacidad. Ya corregida en el prompt. |
| verify | sonnet → opus | ⬆ | Los verify que sirvieron inyectaron mutación y borraron un guard para probar el RED. Eso es razonamiento adversarial, no checklist. |
| archive | haiku → sonnet | ⬆ | Falla reproducible en dos ciclos. Fase corta: el ahorro no compensa un artefacto que miente. |
