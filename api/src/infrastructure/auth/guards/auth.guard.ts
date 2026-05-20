import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPort } from '../../../application/auth/ports/auth-port';

export const REQUIRE_EMPRESA_KEY = 'require-empresa';

/**
 * AuthGuard — NestJS Guard that validates JWT tokens.
 *
 * Extracts the token from the Authorization header (Bearer scheme),
 * verifies it via AuthPort, and injects the user identity into req.user.
 *
 * If the endpoint is decorated with @RequireEmpresa() and the token
 * lacks empresaId, the guard rejects with 401 "Empresa no seleccionada".
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AuthPort') private readonly authPort: AuthPort,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    try {
      const payload = this.authPort.verify(token);

      const requireEmpresa = this.reflector.getAllAndOverride<boolean>(
        REQUIRE_EMPRESA_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requireEmpresa && !payload.empresaId) {
        throw new UnauthorizedException('Empresa no seleccionada');
      }

      request.user = {
        userId: payload.sub,
        role: payload.role,
        empresaId: payload.empresaId,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }
}
