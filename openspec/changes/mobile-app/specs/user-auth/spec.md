---
title: "user-auth Specification"
change: mobile-app
phase: spec
artifact: spec
capability: user-auth
status: draft
---

# Delta for user-auth

## MODIFIED Requirements

### Requirement: Token Refresh

The system MUST allow renewing `access_token` using `refresh_token` from an httpOnly cookie or from the request body. The API MUST accept either form additively so web clients can keep using cookies and mobile clients can send the token in body.

(Previously: refresh_token was only accepted via httpOnly cookie.)

#### Scenario: Refresh via cookie
- GIVEN a valid refresh_token in cookie
- WHEN POST /v1/auth/refresh
- THEN 200 and a new access_token are returned

#### Scenario: Refresh via body
- GIVEN a valid refresh_token in body
- WHEN POST /v1/auth/refresh
- THEN 200 and a new access_token are returned

#### Scenario: Refresh revoked
- GIVEN an invalid or revoked refresh_token
- WHEN POST /v1/auth/refresh
- THEN 401 Unauthorized
