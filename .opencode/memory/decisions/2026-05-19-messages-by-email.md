# ADR: Mensajes por Email como Identificador de Destinatario

**Date**: 2026-05-19
**Status**: accepted
**Supersedes**: none
**Superseded by**: none

## Context

El sistema original usaba `recipientId` (UUID) para identificar destinatarios de mensajes. Esto requería que el remitente conociera el ID del destinatario, lo cual no es práctico en un sistema de mensajería real donde los usuarios se identifican por email.

## Decision

Cambiar el endpoint `POST /v1/messages` para aceptar `recipientEmails: string[]` en lugar de `recipientIds`. El backend resuelve los emails a userIds internamente.

Se agregó también `GET /v1/auth/contacts` para que el frontend pueda mostrar un dropdown de contactos disponibles.

## Alternatives Considered

| Alternative | Pros | Cons |
|---|---|---|
| Mantener recipientId + agregar endpoint de búsqueda | Sin cambios al contrato existente | Doble request del frontend, peor UX |
| Aceptar ambos (email o id) | Máxima flexibilidad | Complejidad innecesaria, ambigüedad |
| Solo email (elegido) | UX natural, single request | Cambio breaking al contrato |

## Consequences

| Area | Impact |
|---|---|
| API Contract | BREAKING — `recipientId` → `recipientEmails`. Requiere spec delta. |
| Frontend | Positivo — dropdown de contactos, mejor UX |
| Performance | Neutro — resolución email→id es O(1) con índice |
| Mobile | Positivo — mismo contrato, sin cambios adicionales |

## References

- openspec/specs/messaging-core/spec.md
- openspec/changes/entrega-4-final/proposal.md
