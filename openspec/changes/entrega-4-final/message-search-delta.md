# Delta Spec: message-search

**Change**: entrega-4-final
**Base spec**: openspec/specs/message-search/spec.md

## Modifications

### R1.5: Include drafts in search

Los drafts del usuario autenticado DEBEN aparecer en los resultados de búsqueda.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.5 | Search includes own drafts | Auth, 1 draft + 1 sent matching | GET /v1/messages/search?q=term | 200, ambos resultados (draft + sent) |
| 1.6 | Search excludes OTHER drafts | Auth, draft ajeno matchea | GET /v1/messages/search?q=term | 200, no incluye draft ajeno |
