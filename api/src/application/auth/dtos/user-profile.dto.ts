/**
 * UserProfileDTO — public user profile returned in API responses.
 *
 * NEVER includes the password hash.
 */
export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  role: { id: number; name: string };
  createdAt: string;
}
