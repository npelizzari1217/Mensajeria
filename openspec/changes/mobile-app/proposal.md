# Proposal: mobile-app (PR7)

## Intent

App mobile en `mobile/` (Expo + RN) con 12 pantallas equivalentes a `web/src/pages/`. Reutiliza `@mensajeria/domain` y consume la API existente. PR único a `main`. Materializa la capability `mobile-app` esbozada en `entrega-4-final` y refina decisiones técnicas pendientes.

## Scope

### In Scope

- Proyecto Expo SDK 51+ en `mobile/`, registrado en `pnpm-workspace.yaml`.
- 12 pantallas: login, register, inbox, sent, compose, message-detail, thread, search, pinned, drafts (list+edit), groups (list+detail).
- Axios client con `EXPO_PUBLIC_API_URL`, interceptor + refresh automático.
- Auth Context, tokens en `expo-secure-store`.
- React Navigation v7 (Native Stack + Bottom Tabs).
- Tamagui como design system.
- API: ampliar `CORS_ORIGIN` a lista (acepta `exp://*` y `http://localhost:8081`).
- API: `POST /v1/auth/refresh` acepta refresh por **body** además de cookie.

### Out of Scope

- Push notifications (PR8), WS realtime, modo offline, forward, export PDF, attachments upload, EAS Build, dark mode, i18n, biometría.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `mobile-app`: refinar Technical Decisions (Tamagui, refresh por body, scope v1).
- `user-auth`: refresh token por body para clientes no-browser.

## Approach

| Tema | Decisión | Tradeoff |
|------|----------|----------|
| Refresh | Body + SecureStore; API acepta cookie *o* body (aditivo) | Cookies httpOnly no andan limpio en RN; `react-native-cookies` es frágil cross-platform |
| UI lib | Tamagui | Theme tokens y perf en listas vs NativeWind más liviano; respaldado por skill `expo-tamagui` |
| State | Context para auth + local hooks | Paridad con web; Zustand innecesario en v1 |
| HTTP | Axios singleton reusando shape de `web/src/lib/api.ts` | — |
| CORS | `CORS_ORIGIN` como array env (`localhost:5173,exp://*,http://localhost:8081`) | Sólo dev permisivo |

## Affected Areas

| Area | Impact | Descripción |
|------|--------|-------------|
| `mobile/` | New | Proyecto Expo completo |
| `pnpm-workspace.yaml` | Minor | Registrar `mobile` |
| `api/src/presentation/http/auth.controller.ts` | Minor | Refresh acepta body |
| `api/src/main.ts` | Minor | CORS lista con `exp://*`, Metro |
| `openspec/specs/mobile-app/spec.md` | Modified | Tamagui, refresh body |
| `openspec/specs/user-auth/spec.md` | Modified | Refresh por body |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tamagui setup en monorepo frágil | Med | Versiones lockeadas, guía oficial |
| Refresh por body amplía attack surface | Low | Cookie sigue default web; body sólo en mobile |
| `exp://*` permisivo | Low | Sólo en dev; prod usa dominio EAS específico |
| 12 pantallas en 1 PR > 400 LOC | High | Aceptado por usuario; commits por pantalla |
| `@mensajeria/domain` no transpila en Metro | Med | `metro.config.js` con `watchFolders` + symlinks |

## Rollback Plan

`git revert <merge-sha>` del PR7. `mobile/` es aislado; los 2 cambios menores en API (CORS, refresh body) son aditivos y compatibles hacia atrás.

## Dependencies

- Node ≥20, pnpm 9, Expo CLI.
- API en `http://<LAN-IP>:3000/v1` accesible desde device/emulator.
- `@mensajeria/domain` ya disponible en workspace.

## Success Criteria

- [ ] `pnpm --filter mobile start` levanta Metro y abre en Expo Go.
- [ ] Login → inbox → detail → reply end-to-end contra API local.
- [ ] Refresh automático al expirar access token (15m).
- [ ] 12 pantallas navegables conectadas a endpoints reales.
- [ ] `@mensajeria/domain` importado sin duplicar código.
- [ ] CORS acepta requests desde Expo Go en LAN.
- [ ] 0 tests rotos en `api/` y `web/`.
