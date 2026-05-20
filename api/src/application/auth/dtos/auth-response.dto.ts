import { UserProfileDTO } from './user-profile.dto';
import { EmpresaDTO } from './empresa.dto';

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserProfileDTO;
  empresas?: EmpresaDTO[];
}
