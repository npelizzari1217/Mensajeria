/**
 * Global navigation reference.
 *
 * Allows non-component code (e.g. Axios interceptors) to imperatively
 * navigate without access to the component tree.
 *
 * Usage:
 *   import { navigationRef, resetToLogin } from '@/navigation/navigationRef';
 *   // Pass navigationRef to <NavigationContainer ref={navigationRef}>
 *   // Call resetToLogin() from the axios interceptor on auth failure.
 */
import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a named screen. Silently drops the call if the navigator
 * is not yet mounted (guard: navigationRef.isReady()).
 */
export function navigate<K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K],
): void {
  if (navigationRef.isReady()) {
    // @ts-expect-error params may be undefined for screens that need none
    navigationRef.navigate(name, params);
  }
}

/**
 * Hard-reset the navigation stack to the Login screen.
 * Called by the Axios interceptor when the refresh token is expired/invalid.
 */
export function resetToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' as keyof RootStackParamList }],
    });
  }
}
