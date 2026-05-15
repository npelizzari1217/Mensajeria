# Tasks: Mobile App de Mensajería (PR7)

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 900-1400 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR, commits por pantalla |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | PR7 único | PR 7 | Base main; commits separados por pantalla + infra |

## Phase 1: Bootstrap & Workspace

- [x] T1.1 Scaffold `mobile/` Expo app. Deps: —. Files: `mobile/package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `pnpm-workspace.yaml`. Ver: `pnpm --filter mobile start` boots; `@mensajeria/domain` resolves. Par: No. Size: L
- [x] T1.2 Register `mobile` in workspace. Deps: T1.1. Files: `pnpm-workspace.yaml`. Ver: pnpm sees the package. Par: No. Size: S
- [x] T1.3 Wire asset placeholders. Deps: T1.1. Files: `mobile/assets/icon.png`, `mobile/assets/splash.png`. Ver: Expo loads without asset errors. Par: Sí. Size: S

## Phase 2: Tamagui setup

- [x] T2.1 Create Tamagui config. Deps: T1.1. Files: `mobile/src/theme/tamagui.config.ts`. Ver: config imports cleanly under TS. Par: No. Size: M
- [x] T2.2 Wrap app with Tamagui providers. Deps: T2.1. Files: `mobile/app/index.tsx`. Ver: app renders with theme tokens. Par: No. Size: M

## Phase 3: API tweaks

- [x] T3.1 Accept CORS origins array. Deps: —. Files: `api/src/main.ts`. Ver: `exp://*` and `http://localhost:8081` pass in dev. Par: No. Size: M
- [x] T3.2 Accept refresh token in body. Deps: —. Files: `api/src/presentation/auth/auth.controller.ts`. Ver: `POST /v1/auth/refresh` returns 200 with body token; 401 on revoked. Par: No. Size: M

## Phase 4: Core infra mobile

- [x] T4.1 Add SecureStore wrapper. Deps: T1.1. Files: `mobile/src/auth/storage.ts`. Ver: get/set/delete tokens work via `expo-secure-store`. Par: Sí. Size: S
- [x] T4.2 Build Axios client + refresh flow. Deps: T4.1, T3.2. Files: `mobile/src/api/client.ts`. Ver: 401 triggers one refresh and request retry. Par: No. Size: L
- [x] T4.3 Add AuthContext restore/login/logout. Deps: T4.1, T4.2. Files: `mobile/src/auth/auth.context.tsx`, `mobile/src/auth/useAuth.ts`. Ver: cold start restores session; logout clears SecureStore. Par: No. Size: L
- [x] T4.4 Add navigation ref for logout redirect. Deps: T4.3. Files: `mobile/src/navigation/navigationRef.ts` (new), `mobile/src/api/client.ts`. Ver: interceptor can navigate to Login when ready. Par: No. Size: M

## Phase 5: Navigation skeleton

- [x] T5.1 Define navigation types. Deps: T4.3. Files: `mobile/src/navigation/types.ts`. Ver: root/auth/tabs/more params compile. Par: Sí. Size: S
- [x] T5.2 Create RootNavigator auth gate. Deps: T5.1, T4.3. Files: `mobile/src/navigation/RootNavigator.tsx`. Ver: no session shows AuthStack; session shows AppTabs. Par: No. Size: M
- [x] T5.3 Create AuthStack. Deps: T5.1. Files: `mobile/src/navigation/AuthStack.tsx`. Ver: Login/Register reachable only unauthenticated. Par: Sí. Size: M
- [x] T5.4 Create AppTabs + MoreStack shell. Deps: T5.1, T5.2. Files: `mobile/src/navigation/AppTabs.tsx`, `mobile/src/navigation/MoreStack.tsx`. Ver: tabs mount and nested More routes exist. Par: No. Size: L

## Phase 6: Auth screens

- [x] T6.1 Build Login screen. Deps: T4.3, T5.3. Files: `mobile/src/screens/auth/LoginScreen.tsx`. Ver: valid login stores session and opens inbox. Par: No. Size: L
- [x] T6.2 Build Register screen. Deps: T4.3, T5.3. Files: `mobile/src/screens/auth/RegisterScreen.tsx`. Ver: valid register lands in auth flow or inbox per API response. Par: Sí. Size: M

## Phase 7: Messaging screens

- [x] T7.1 Build Inbox screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/messaging/InboxScreen.tsx`, `mobile/src/api/messages.ts`, `mobile/src/navigation/MessagesStack.tsx`. Ver: first page renders and loads more pages. Par: No. Size: L
- [x] T7.2 Build Sent screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/messaging/SentScreen.tsx`. Ver: empty state shows when no sent messages. Par: Sí. Size: M
- [x] T7.3 Build Compose screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/messaging/ComposeScreen.tsx`. Ver: send creates message; empty recipients blocked. Par: No. Size: L
- [x] T7.4 Build MessageDetail screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/messaging/MessageDetailScreen.tsx`. Ver: sender/body/recipients/sentAt show; pin/unpin toggles. Par: Sí. Size: L
- [x] T7.5 Build Thread screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/messaging/ThreadScreen.tsx`. Ver: thread chain renders and reply creates a message. Par: Sí. Size: L

## Phase 8: Search screen

- [x] T8.1 Build Search screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/search/SearchScreen.tsx`. Ver: empty query blocked; matches paginate. Par: Sí. Size: M

## Phase 9: Drafts screens

- [x] T9.1 Build Drafts list. Deps: T4.2, T5.4. Files: `mobile/src/screens/drafts/DraftsListScreen.tsx`. Ver: drafts list renders from API. Par: Sí. Size: M
- [x] T9.2 Build DraftEdit screen. Deps: T9.1, T4.2. Files: `mobile/src/screens/drafts/DraftEditScreen.tsx`. Ver: edit/save/send/discard persist correctly. Par: No. Size: L

## Phase 10: Groups screens

- [x] T10.1 Build Groups list. Deps: T4.2, T5.4. Files: `mobile/src/screens/groups/GroupsListScreen.tsx`. Ver: only visible groups render. Par: Sí. Size: M
- [x] T10.2 Build Group detail. Deps: T10.1. Files: `mobile/src/screens/groups/GroupDetailScreen.tsx`. Ver: group + members render. Par: No. Size: M

## Phase 11: Pinned screen

- [x] T11.1 Build Pinned screen. Deps: T4.2, T5.4. Files: `mobile/src/screens/pinned/PinnedScreen.tsx`. Ver: pinned list renders and reflects toggles. Par: Sí. Size: M

## Phase 12: Shared components

- [x] T12.1 Add MessageCard. Deps: T4.2. Files: `mobile/src/components/MessageCard.tsx`. Ver: inbox/sent/search reuse one card. Par: Sí. Size: M
- [x] T12.2 Add ScreenContainer. Deps: T2.2. Files: `mobile/src/components/ScreenContainer.tsx`. Ver: safe-area + base padding are consistent. Par: Sí. Size: S
- [x] T12.3 Add EmptyState. Deps: T2.2. Files: `mobile/src/components/EmptyState.tsx`. Ver: empty sent/drafts/groups reuse one placeholder. Par: Sí. Size: S

## Phase 13: Polish & verification

- [x] T13.1 Add formatters. Deps: T1.1. Files: `mobile/src/lib/formatters.ts`. Ver: dates render via `Intl.DateTimeFormat`. Par: Sí. Size: S
- [x] T13.2 Polish navigation and screen styles. Deps: T6.1-T12.3. Files: `mobile/src/**/*`. Ver: no obvious layout breaks on phone. Par: No. Size: M
- [x] T13.3 Run manual smoke flow and README notes. Deps: T13.2, T3.1, T3.2. Files: `README.md` or `mobile/README.md` if added. Ver: login → inbox → detail → reply succeeds in Expo Go. Par: No. Size: M

## Commit Plan

- C1 Foundation: T1.1-T1.3
- C2 Tamagui: T2.1-T2.2
- C3 API: T3.1-T3.2
- C4 Mobile auth infra: T4.1-T4.4
- C5 Navigation shell: T5.1-T5.4
- C6 Login
- C7 Register
- C8 Inbox
- C9 Sent
- C10 Compose
- C11 Detail
- C12 Thread
- C13 Search
- C14 Drafts list + edit
- C15 Groups list + detail
- C16 Pinned
- C17 Shared components + formatters
- C18 Polish + smoke verification
