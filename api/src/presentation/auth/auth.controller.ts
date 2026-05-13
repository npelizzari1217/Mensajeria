import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/auth/use-cases/get-current-user.use-case';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { RegisterRequest } from './dto/register.request';
import { LoginRequest } from './dto/login.request';

/**
 * AuthController — REST endpoints for authentication.
 *
 * All endpoints return standard { data: ... } envelope via ResponseInterceptor.
 * Errors are mapped via AppExceptionFilter.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterRequest) {
    const result = await this.registerUserUseCase.execute({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequest,
    @Req() req: Request,
  ) {
    const result = await this.loginUseCase.execute({
      email: body.email,
      password: body.password,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    const authResponse = result.unwrap();

    // Set refresh token as httpOnly cookie
    const response = req.res!;
    response.cookie('refreshToken', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      data: {
        accessToken: authResponse.accessToken,
        user: authResponse.user,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new Error('Refresh token not found');
    }

    const result = await this.refreshTokenUseCase.execute(token);
    if (result.isErr()) {
      throw result.unwrapErr();
    }

    const refreshResult = result.unwrap();
    return { data: { accessToken: refreshResult.accessToken, user: refreshResult.user } };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: { userId: string; role: string }, @Req() req: Request) {
    await this.logoutUseCase.execute(user.userId);

    // Clear the refresh token cookie
    const response = req.res!;
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/v1/auth/refresh',
    });

    return { data: { message: 'Logged out successfully' } };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: { userId: string; role: string }) {
    const result = await this.getCurrentUserUseCase.execute(user.userId);
    if (result.isErr()) {
      throw result.unwrapErr();
    }
    return { data: result.unwrap() };
  }
}
