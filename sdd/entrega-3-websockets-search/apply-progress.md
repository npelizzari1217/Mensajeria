# Apply Progress: PR 3 — Web Integration (Socket.io client + Search UI)

**What**: SDD apply-progress for PR 3 (Web Integration — Socket.io client + Search UI)
**Why**: Complete the WebSocket integration on the frontend: real-time updates in inbox via Socket.IO, and full-text search page with pagination.

## Completed Tasks

### T-001: Add socket.io-client to web/package.json
- **Status**: ✅ Complete
- **Files**: `web/package.json`
- **What**: Added `"socket.io-client": "^4.8.1"` to dependencies. Ran `pnpm install`.

### T-002: Create SocketContext
- **Status**: ✅ Complete
- **Files**: `web/src/contexts/socket.context.tsx`
- **What**:
  - `SocketProvider` manages Socket.IO connection lifecycle via `useAuth().isAuthenticated`
  - Uses `getAccessToken()` from client.ts for the JWT token
  - Auth is passed as a function `auth: (cb) => cb({ token: getAccessToken() })` for fresh tokens on reconnect
  - Connects to `http://localhost:3000/messages`
  - Exposes `socket: Socket | null` and `isConnected: boolean`
  - Cleanup on unmount

### T-003: Wrap App with SocketProvider
- **Status**: ✅ Complete
- **Files**: `web/src/main.tsx`
- **What**: Imported and wrapped `<SocketProvider>` inside `<AuthProvider>`.

### T-004: InboxPage — listen to message:new
- **Status**: ✅ Complete
- **Files**: `web/src/pages/inbox.page.tsx`
- **What**:
  - Imported `useSocket()`
  - Added `useEffect` with socket `message:new` listener
  - On event: silently re-fetches inbox via `fetchInbox()`
  - Cleans up listener on unmount

### T-005: Add search helper to API client
- **Status**: ✅ Complete
- **Files**: `web/src/api/client.ts`
- **What**: Added `searchMessages(q, page, pageSize)` with `SearchResult`/`SearchResponse` types.

### T-006: Create SearchPage
- **Status**: ✅ Complete
- **Files**: `web/src/pages/search.page.tsx`
- **What**: Full search page with input + button, idle/loading/error/empty/results states, pagination, and row navigation.

### T-007: Add search route and layout link
- **Status**: ✅ Complete
- **Files**: `web/src/App.tsx`, `web/src/components/layout.tsx`
- **What**: Added `/search` route and "Buscar" nav link.

### T-008: Tests + Styles
- **Status**: ✅ Complete
- **Files**:
  - `web/vite.config.ts` — vitest config (jsdom, setup)
  - `web/src/__tests__/setup.ts` — jest-dom imports
  - `web/src/__tests__/search-page.test.tsx` — 8 tests
  - `web/src/__tests__/socket-context.test.tsx` — 2 tests
  - `web/src/styles.css` — search-bar CSS

## Files Changed
| File | Action | What Was Done |
|------|--------|---------------|
| `web/package.json` | Modified | Added socket.io-client + test deps |
| `web/src/contexts/socket.context.tsx` | Created | SocketProvider + useSocket hook |
| `web/src/main.tsx` | Modified | Wrapped App with SocketProvider |
| `web/src/pages/inbox.page.tsx` | Modified | Added message:new WS listener |
| `web/src/api/client.ts` | Modified | Added searchMessages helper + types |
| `web/src/pages/search.page.tsx` | Created | Full search page |
| `web/src/App.tsx` | Modified | Added /search route |
| `web/src/components/layout.tsx` | Modified | Added "Buscar" link |
| `web/src/styles.css` | Modified | Added search-bar styles |
| `web/vite.config.ts` | Modified | Added vitest test config |
| `web/src/__tests__/setup.ts` | Created | Test setup |
| `web/src/__tests__/search-page.test.tsx` | Created | 8 tests |
| `web/src/__tests__/socket-context.test.tsx` | Created | 2 tests |

## Deviations from Design/Prompt
1. **SocketContext token source**: Prompt assumes `useAuth().token`, but AuthContext doesn't expose `token`. Used `getAccessToken()` from client.ts instead.
2. **InboxPage WS handling**: Prompt shows partial state insertion with subject/senderName. Actual WS payload (`{ messageId, senderId }` only) lacks those fields. Used re-fetch instead.
3. **createContext default**: Used `null` (matching AuthContext pattern) instead of a default object, for proper useSocket guard behavior.

## Issues Found
1. `MessageSent` domain event doesn't carry `subject` or `senderName` — WS payload `message:new` only has `messageId` and `senderId`.
2. Token refresh while socket is connected: if JWT is refreshed, socket stays on old token. Acceptable for MVP (auth function re-reads on disconnect/reconnect).
3. WS URL is hardcoded to `http://localhost:3000/messages` — should use env var.

## Status
8/8 tasks complete. Build passes (Vite). All 10 tests pass.
