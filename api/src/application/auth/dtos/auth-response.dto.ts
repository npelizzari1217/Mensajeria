import { UserProfileDTO } from './user-profile.dto';

/**
 * AuthResponseDTO — output for login and refresh operations.
 */
export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDTO;
}
