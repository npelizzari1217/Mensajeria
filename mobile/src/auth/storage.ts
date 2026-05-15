/**
 * Typed wrapper over expo-secure-store.
 *
 * Keys stored:
 *   - 'accessToken'  — short-lived JWT used in Authorization header
 *   - 'refreshToken' — long-lived token used to obtain new access tokens
 *
 * All operations are async. SecureStore uses Keychain (iOS) / Keystore (Android).
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const tokenStorage = {
  getAccessToken: (): Promise<string | null> =>
    SecureStore.getItemAsync(ACCESS_KEY),

  getRefreshToken: (): Promise<string | null> =>
    SecureStore.getItemAsync(REFRESH_KEY),

  setTokens: (access: string, refresh: string): Promise<[void, void]> =>
    Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]),

  clear: (): Promise<[void, void]> =>
    Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]),
};
