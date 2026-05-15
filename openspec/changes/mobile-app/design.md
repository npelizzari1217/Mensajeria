---
title: "Design: mobile-app (PR7)"
change: mobile-app
phase: design
status: draft
---

# Design: Mobile App de Mensajería (PR7)

## Technical Approach

App Expo SDK 51 en `mobile/` como nuevo workspace package. Reutiliza la forma exacta de `web/src/api/` para los clientes HTTP, porta el patrón `AuthContext` de `web/src/contexts/auth.context.tsx` adaptándolo a SecureStore, y navega con React Navigation v7 (Native Stack + Bottom Tabs). La API recibe dos cambios aditivos: CORS como array y refresh por body.

---

## Architecture Decisions

| Decisión | Elegida | Descartada | Rationale |
|----------|---------|------------|-----------|
| Fetching pattern | `useEffect + axios directo` por pantalla | hook custom `useFetch` genérico | Las pantallas tienen necesidades de parámetros muy distintas (paginación, filtros, ids). Un hook genérico termina siendo un wrapper con más complejidad que valor. La web usa el mismo patrón y funciona. |
| Token storage | `expo-secure-store` | `AsyncStorage` | SecureStore usa Keychain (iOS) y Keystore (Android). AsyncStorage es texto plano. Los tokens son credenciales, no preferencias. |
| Tamagui vs NativeWind | Tamagui | NativeWind | Decisión ya tomada en proposal. Tamagui provee typed tokens, mejor perf en listas con `@tamagui/flash-list`, y el skill `expo-tamagui` cubre la setup. |
| State global | `AuthContext` únicamente | Zustand | Paridad exacta con web. Zustand no aporta nada con solo auth global en v1. |
| Metro monorepo | `watchFolders` + `resolver.unstable_enablePackageExports` | Symlinks manuales | La config oficial de Expo para monorepos pnpm usa esta combinación. Symlinks sin watchFolders producen el error `Unable to resolve module @mensajeria/domain`. |
| Refresh en mobile | Body `{ refreshToken }` | Cookie httpOnly | `react-native-cookies` es frágil. El interceptor ya tiene el token en SecureStore; pasarlo por body es la vía más simple y estable. La API lo acepta aditivamente (no breaking). |

---

## Data Flow

### Auth Startup

```
App mount
  └─▶ AuthProvider.useEffect
        ├─▶ SecureStore.getItem('refreshToken')
        │     ├─ null → setIsLoading(false) → AuthStack
        │     └─ token → POST /v1/auth/refresh { refreshToken: token }
        │           ├─ 200 → setUser + setAccessToken → AppStack
        │           └─ 401 → SecureStore.deleteItem → AuthStack
```

### Request Interceptor (Axios)

```
Every request
  └─▶ interceptor.request
        └─▶ config.headers.Authorization = `Bearer ${accessToken}`

Response 401 (first time)
  └─▶ interceptor.response
        ├─ isRefreshing=true → queue concurrent requests
        └─ POST /v1/auth/refresh { refreshToken }
              ├─ 200 → setAccessToken(new) + SecureStore.setItem + drain queue + retry
              └─ failure → SecureStore.deleteItem + authContext.logout() + navigate('Login')
```

### Navigation

```
RootNavigator (Stack)
  ├─ [isAuthenticated=false] AuthStack (Native Stack)
  │     ├─ Login
  │     └─ Register
  └─ [isAuthenticated=true] AppStack (Bottom Tabs)
        ├─ Tab: Inbox        → InboxScreen
        ├─ Tab: Sent         → SentScreen
        ├─ Tab: Compose      → ComposeScreen
        ├─ Tab: Search       → SearchScreen
        └─ Tab: More         → (Drafts, Groups, Pinned via nested Stack)
              ├─ DraftsList → DraftEdit
              ├─ GroupsList → GroupDetail
              └─ Pinned
        [modal/push desde Inbox y Sent]:
              ├─ MessageDetail (params: messageId)
              └─ Thread       (params: messageId)
```

---

## File Changes

### New files — `mobile/`

| File | Action | Description |
|------|--------|-------------|
| `mobile/app.config.ts` | Create | Expo config: name, slug, scheme `mensajeria`, plugins, EXPO_PUBLIC_API_URL |
| `mobile/metro.config.js` | Create | watchFolders monorepo + symlinks + packageExports |
| `mobile/babel.config.js` | Create | preset expo + plugin `@tamagui/babel-plugin` |
| `mobile/tsconfig.json` | Create | extends `../../tsconfig.base.json`, paths `@/*` → `./src/*` |
| `mobile/package.json` | Create | deps versionadas (ver sección Interfaces) |
| `mobile/src/theme/tamagui.config.ts` | Create | tokens, themes, createTamagui |
| `mobile/app/index.tsx` | Create | Entry point: Providers wrap + RootNavigator |
| `mobile/src/auth/auth.context.tsx` | Create | Port de web/src/contexts/auth.context.tsx con SecureStore |
| `mobile/src/auth/useAuth.ts` | Create | Re-export hook desde context |
| `mobile/src/auth/storage.ts` | Create | Wrapper typed sobre expo-secure-store |
| `mobile/src/api/client.ts` | Create | Port de web/src/api/client.ts: baseURL desde env, interceptor body-refresh |
| `mobile/src/api/drafts.ts` | Create | Port exacto de web/src/api/drafts.ts |
| `mobile/src/api/groups.ts` | Create | Port exacto de web/src/api/groups.ts |
| `mobile/src/api/pinned.ts` | Create | Port exacto de web/src/api/pinned.ts |
| `mobile/src/api/messages.ts` | Create | GET inbox, sent, detail, thread, search, compose, reply |
| `mobile/src/navigation/RootNavigator.tsx` | Create | Elige AuthStack o AppStack según isAuthenticated |
| `mobile/src/navigation/AuthStack.tsx` | Create | Native Stack: Login, Register |
| `mobile/src/navigation/AppTabs.tsx` | Create | Bottom Tabs: Inbox, Sent, Compose, Search, More |
| `mobile/src/navigation/MoreStack.tsx` | Create | Stack dentro de More: DraftsList, DraftEdit, GroupsList, GroupDetail, Pinned |
| `mobile/src/navigation/types.ts` | Create | RootStackParamList, AuthStackParamList, AppTabsParamList, MoreStackParamList |
| `mobile/src/screens/auth/LoginScreen.tsx` | Create | Form login |
| `mobile/src/screens/auth/RegisterScreen.tsx` | Create | Form register |
| `mobile/src/screens/messaging/InboxScreen.tsx` | Create | Lista paginada, filtro status |
| `mobile/src/screens/messaging/SentScreen.tsx` | Create | Lista paginada sent |
| `mobile/src/screens/messaging/ComposeScreen.tsx` | Create | Form compose + send |
| `mobile/src/screens/messaging/MessageDetailScreen.tsx` | Create | Detalle + pin/unpin |
| `mobile/src/screens/messaging/ThreadScreen.tsx` | Create | Hilo + reply |
| `mobile/src/screens/search/SearchScreen.tsx` | Create | Input + lista paginada |
| `mobile/src/screens/drafts/DraftsListScreen.tsx` | Create | Lista drafts |
| `mobile/src/screens/drafts/DraftEditScreen.tsx` | Create | Editar + send + discard |
| `mobile/src/screens/groups/GroupsListScreen.tsx` | Create | Lista grupos |
| `mobile/src/screens/groups/GroupDetailScreen.tsx` | Create | Detalle + miembros |
| `mobile/src/screens/pinned/PinnedScreen.tsx` | Create | Lista pinned |
| `mobile/src/components/MessageCard.tsx` | Create | Card reutilizable en Inbox/Sent/Search |
| `mobile/src/components/ScreenContainer.tsx` | Create | SafeAreaView + padding base |
| `mobile/src/components/EmptyState.tsx` | Create | Placeholder "no hay items" |
| `mobile/src/lib/formatters.ts` | Create | formatDate (Intl.DateTimeFormat, no moment) |
| `mobile/assets/icon.png` | Create | Icono placeholder (1024x1024) |
| `mobile/assets/splash.png` | Create | Splash placeholder |

### Modified files — `api/` y workspace

| File | Action | Description |
|------|--------|-------------|
| `api/src/main.ts` | Modify | CORS_ORIGIN split por coma → array; acepta `exp://*` y `http://localhost:8081` |
| `api/src/presentation/auth/auth.controller.ts` | Modify | `refresh()`: lee `body.refreshToken` si `req.cookies.refreshToken` es undefined |
| `pnpm-workspace.yaml` | Modify | Agregar `- "mobile"` |

---

## Interfaces / Contracts

### package.json — dependencies versionadas

```json
{
  "name": "mobile",
  "version": "0.1.0",
  "main": "node_modules/expo/AppEntry.js",
  "dependencies": {
    "@mensajeria/domain": "workspace:*",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.11.0",
    "@tamagui/babel-plugin": "^1.110.0",
    "@tamagui/config": "^1.110.0",
    "@tamagui/flash-list": "^1.110.0",
    "axios": "^1.7.9",
    "expo": "~51.0.28",
    "expo-secure-store": "~13.0.2",
    "expo-status-bar": "~1.12.1",
    "react": "18.2.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "tamagui": "^1.110.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.79",
    "typescript": "~5.3.3"
  }
}
```

### app.config.ts (fragmento clave)

```typescript
export default {
  name: 'Mensajería',
  slug: 'mensajeria',
  scheme: 'mensajeria',
  version: '1.0.0',
  orientation: 'portrait',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
  plugins: ['expo-secure-store'],
};
```

### metro.config.js

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
```

### babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './src/theme/tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
    ],
  };
};
```

### AuthContext mobile (diferencias vs web)

```typescript
// storage.ts — wrapper typed
import * as SecureStore from 'expo-secure-store';
export const tokenStorage = {
  getRefreshToken: () => SecureStore.getItemAsync('refreshToken'),
  setTokens: (access: string, refresh: string) =>
    Promise.all([
      SecureStore.setItemAsync('accessToken', access),
      SecureStore.setItemAsync('refreshToken', refresh),
    ]),
  clear: () =>
    Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]),
};
```

```typescript
// AuthContext diferencias vs web:
// - restore(): lee refreshToken de SecureStore → POST /auth/refresh con body { refreshToken }
// - login(): guarda access+refresh en SecureStore
// - logout(): SecureStore.clear() + setUser(null) + setAccessToken(null)
// - NO usa window.location → navega via navigationRef.navigate('Login')
```

### API auth.controller.ts — refresh patch

```typescript
@Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Req() req: Request, @Body() body: { refreshToken?: string }) {
  const token = req.cookies?.refreshToken ?? body.refreshToken;
  if (!token) throw new UnauthorizedException('Refresh token not found');
  // ... resto sin cambios
}
```

### api/src/main.ts — CORS patch

```typescript
const rawOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const origin = rawOrigin.includes(',')
  ? rawOrigin.split(',').map((s) => s.trim())
  : rawOrigin;
app.enableCors({ origin, credentials: true });
```

---

## Testing Strategy

| Layer | Qué testear | Approach |
|-------|-------------|----------|
| Unit (api) | `refresh()` acepta body cuando no hay cookie | Jest + supertest, test en `auth.controller.spec.ts` |
| Unit (api) | CORS acepta múltiples origins | Jest, test en `main` o middleware |
| Unit (domain) | Sin cambios — no tocar | — |
| E2E manual | Login → inbox → detail → reply flujo completo | Expo Go en LAN contra API local |
| E2E manual | Token expirado → refresh automático → retry | Forzar 401 cambiando JWT_EXPIRY en .env |

> No hay test runner configurado para mobile en v1 (out of scope). Los tests unitarios van en `api/`.

---

## Migration / Rollout

No hay migración de datos. Los cambios en API son aditivos:
- Refresh por body: si `cookies.refreshToken` está presente, lo usa primero (web no se rompe).
- CORS array: es un superset del valor anterior.

Rollback: `git revert <merge-sha>` de PR7. `mobile/` es aislado. Los dos patches de API son trivialmente reversibles.

---

## Open Questions

- [ ] **Android SecureStore**: `expo-secure-store` requiere `android.permissions` en `app.config.ts`? Verificar si el plugin lo inyecta automáticamente o hay que declararlo.
- [ ] **Tamagui + TS strict `noUnusedLocals`**: los tokens generados pueden producir falsos positivos. Puede requerir `// eslint-disable` en `tamagui.config.ts` o excluir el archivo en tsconfig.
- [ ] **`exp://*` en CORS prod**: confirmar con el equipo si se usa EAS y cuál es el scheme del build de producción antes de tachar como solo-dev.
- [ ] **navigationRef para logout desde interceptor**: `createNavigationContainerRef()` requiere que el ref esté montado antes de llamar `navigate`. El interceptor necesita un guard `if (navigationRef.isReady())`.
