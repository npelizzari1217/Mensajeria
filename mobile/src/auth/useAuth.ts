/**
 * Re-export of the useAuth hook for ergonomic imports.
 *
 * Usage:
 *   import { useAuth } from '@/auth/useAuth';
 *   const { user, login, logout } = useAuth();
 */
export { useAuth } from './auth.context';
export type { UserProfile } from './auth.context';
