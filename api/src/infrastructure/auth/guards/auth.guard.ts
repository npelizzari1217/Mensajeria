import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthPort } from '../../../application/auth/ports/auth-port';

/**
 * AuthGuard — NestJS Guard that validates JWT tokens.
 *
 * Extracts the token from the Authorization header (Bearer scheme),
 * verifies it via AuthPort, and injects the user identity into req.user.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authPort: AuthPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    try {
      const payload = this.authPort.verify(token);
      // Attach user identity to request for downstream use
      request.user = {
        userId: payload.sub,
        role: payload.role,
      };
      return true;
    } catch {
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
