import {
  EmpresaId,
  UserId,
  UserRepository,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { AuthPort, TokenPayload } from '../ports/auth-port';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { EmpresaDTO } from '../dtos/empresa.dto';

export class SelectEmpresaUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly authPort: AuthPort,
    private readonly refreshTokenExpiresIn: string,
  ) {}

  async execute(userId: string, empresaId: string): Promise<Result<SelectEmpresaResponse, Error>> {
    const uid = UserId.reconstruct(userId);
    const eid = EmpresaId.reconstruct(empresaId);

    const isMember = await this.userRepo.isMemberOf(uid, eid);
    if (!isMember) {
      return err(new Error('User is not a member of this empresa'));
    }

    // Fetch user entity to get domain-validated role (PascalCase),
    // NOT the raw Prisma enum from the user_empresas pivot table
    const userResult = await this.userRepo.findById(uid);
    if (userResult.isErr()) {
      return err(userResult.unwrapErr());
    }
    const user = userResult.unwrap();

    const empresasResult = await this.userRepo.getEmpresas(uid);
    const empresas: EmpresaDTO[] = [];
    if (empresasResult.isOk()) {
      const memberships = empresasResult.unwrap();
      empresas.push(...memberships.map((m) => ({
        id: m.empresaId.get(),
        nombre: m.nombre,
        role: user.getRole().get(),
      })));
    }

    const selectedEmpresa = empresas.find((e) => e.id === empresaId);
    if (!selectedEmpresa) {
      return err(new Error('Empresa not found'));
    }

    const payload: TokenPayload = {
      sub: userId,
      role: user.getRole().get(),
      empresaId,
    };

    const accessToken = this.authPort.sign(payload);
    const refreshToken = this.authPort.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    return ok({
      accessToken,
      refreshToken,
      empresa: selectedEmpresa,
    });
  }
}

export interface SelectEmpresaResponse {
  accessToken: string;
  refreshToken: string;
  empresa: EmpresaDTO;
}
