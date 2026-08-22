# CLAUDE.md — mensajeria

## SDD — modelo por fase

Este repo trabaja con Spec-Driven Development: los artefactos viven en `openspec/` y en
`sdd/`. Cada fase la ejecuta su subagente dedicado vía la herramienta Agent, **nunca
invocando la skill** (las `sdd-*/SKILL.md` traen `delegate_only: true`: si las cargás como
skill, sos el orquestador y tenés que delegar igual). El `model` es obligatorio en cada
llamada.

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
