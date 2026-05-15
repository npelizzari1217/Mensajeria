/**
 * Navigation type definitions for React Navigation v7.
 *
 * RootStackParamList  — top-level discriminator (Auth vs App)
 * AuthStackParamList  — unauthenticated screens
 * AppTabsParamList    — main bottom tabs
 * MoreStackParamList  — nested stack inside the "More" tab
 *
 * The global augmentation of `ReactNavigation.RootParamList` enables
 * type-safe navigation hooks anywhere in the app without explicit generics.
 */

// ── Root (discriminator) ─────────────────────────────────────────────

export type RootStackParamList = {
  /** Rendered when the user is NOT authenticated */
  Auth: undefined;
  /** Rendered when the user IS authenticated */
  App: undefined;
  // Flat shortcuts so the interceptor's resetToLogin() can target 'Login'
  Login: undefined;
  Register: undefined;
};

// ── Auth stack ───────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ── App tabs ─────────────────────────────────────────────────────────

export type AppTabsParamList = {
  Inbox: undefined;   // MessagesStack (Inbox + Detail + Thread)
  Compose: undefined;
  Search: undefined;
  More: undefined;
};

// ── Messages stack (dentro del tab Inbox) ────────────────────────────

export type MessagesStackParamList = {
  InboxList: undefined;
  MessageDetail: { messageId: string };
  Thread: { messageId: string };
};

// ── Sent stack (dentro de MoreStack) ────────────────────────────────

export type SentStackParamList = {
  SentList: undefined;
  MessageDetail: { messageId: string };
  Thread: { messageId: string };
};

// ── More nested stack ────────────────────────────────────────────────

export type MoreStackParamList = {
  MoreHome: undefined;    // pantalla de menú "Más"
  Drafts: undefined;
  DraftEdit: { id?: string };   // Fase 9: editar/crear borrador
  Pinned: undefined;
  Groups: undefined;
  GroupDetail: { id: string };  // Fase 10: detalle de grupo
  Sent: undefined;        // SentScreen (sin sub-stack por ahora)
  MessageDetail: { messageId: string };
  Thread: { messageId: string };
};

// ── Global augmentation for hook autocomplete ────────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
