---
title: "realtime-notifications Specification"
change: entrega-3-websockets-search
phase: spec
artifact: spec
domain: realtime-notifications
status: draft
---

# Realtime Notifications Specification

## Purpose

Authenticated users SHALL receive real-time notifications via WebSocket for message events.

## Requirements

### Requirement: R1 — WebSocket Gateway

MUST authenticate connections via JWT during handshake. MUST assign a room per userId.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Connect | valid JWT | WS connect with token param | 200, joined room `user:{id}` |
| 1.2 | Invalid token | expired or malformed JWT | WS connect | 401, connection rejected |
| 1.3 | Reconnect | token expired, refresh available | WS reconnect with fresh JWT | reconnected, same room |

### Requirement: R2 — EventBus Bridge

MUST bridge DomainEvent to WebSocket event for `message:new` and `message:read`.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | MessageSent | MessageSent event published | handler processes | WS emits `message:new` to recipient room |
| 2.2 | MessageRead | MessageRead event published | handler processes | WS emits `message:read` to sender room |
| 2.3 | Unknown event | unrelated DomainEvent | handler processes | no emission, silently ignored |

### Requirement: R3 — Delivery Guarantees

SHOULD deliver WS frame within 500ms. MUST NOT block EventBus on WS failure.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Latency | recipient connected | event published | WS frame received in <500ms |
| 3.2 | Offline | recipient disconnected | event published | handler logs warning, no crash |
| 3.3 | No listeners | recipient room has no sockets | event published | event consumed, no error raised |
