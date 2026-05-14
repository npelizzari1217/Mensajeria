---
title: "message-search Specification"
change: entrega-3-websockets-search
phase: spec
artifact: spec
domain: message-search
status: draft
---

# Message Search Specification

## Purpose

Authenticated users SHALL search their messages via full-text search on subject and body.

## Requirements

### Requirement: R1 — Full-Text Search

MUST search subject and body using PostgreSQL tsvector with Spanish config.
MUST return only messages where the authenticated user is sender or recipient.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 1.1 | Match body | 2 msgs with "contrato" in body, user owns | GET /v1/messages/search?q=contrato | 200, 2 results ranked by relevance |
| 1.2 | Match subject | 1 msg with "urgente" in subject | GET /v1/messages/search?q=urgente | 200, includes that message |
| 1.3 | No match | no messages contain term | GET /v1/messages/search?q=zzzzz | 200, empty array |
| 1.4 | Access filter | 3 msgs total, 2 user's, 1 another's | GET /v1/messages/search?q=term | only user's 2 messages |

### Requirement: R2 — Pagination

MUST paginate results. Default pageSize SHALL be 20. Maximum pageSize SHALL be 100.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 2.1 | Default | 50 matching messages | GET /v1/messages/search?q=term | 20 results, totalPages, currentPage |
| 2.2 | Custom page | 50 matching messages | GET /v1/messages/search?q=term&pageSize=10&page=2 | results 11-20 |
| 2.3 | Exceeds max | 50 matching messages | GET /v1/messages/search?q=term&pageSize=200 | 422 |

### Requirement: R3 — Input Validation

MUST reject invalid params with 422.

| # | Scenario | GIVEN | WHEN | THEN |
|---|----------|-------|------|------|
| 3.1 | Empty q | authenticated | GET /v1/messages/search?q= | 422 |
| 3.2 | Missing q | authenticated | GET /v1/messages/search | 422 |
| 3.3 | Negative page | authenticated | GET /v1/messages/search?q=hi&page=-1 | 422 |
