import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateRoleUseCase } from '../../application/role/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/role/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/role/use-cases/delete-role.use-case';
import { ListRolesUseCase } from '../../application/role/use-cases/list-roles.use-case';
import { CallerContext } from '../../application/auth/dtos/caller-context.dto';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';

/**
 * RoleController — REST endpoints for role CRUD.
 *
 * GET    /roles        — List roles (Admin=1, Supervisor=2)
 * POST   /roles        — Create role (Admin=1 only)
 * PATCH  /roles/:id    — Update role (Admin=1 only)
 * DELETE /roles/:id    — Delete role (Admin=1 only)
 *
 * All endpoints are protected by AuthGuard + RolesGuard.
 * Domain errors are mapped to HTTP by AppExceptionFilter.
 */
@Controller('roles')
export class RoleController {
  constructor(
    private readonly listRoles: ListRolesUseCase,
    private readonly createRole: CreateRoleUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleUseCase,
  ) {}

  // ── List Roles ────────────────────────────────────────────────────

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(1, 2)
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: { userId: string; role: string; roleId: number; empresaId?: string }) {
    const caller: CallerContext = this.buildCaller(user);
    const result = await this.listRoles.execute(caller);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  // ── Create Role ───────────────────────────────────────────────────

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: { userId: string; role: string; roleId: number; empresaId?: string },
  ) {
    const caller: CallerContext = this.buildCaller(user);
    const result = await this.createRole.execute({
      name: body.name,
      description: body.description,
      caller,
    });
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  // ── Update Role ───────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string; description?: string },
    @CurrentUser() user: { userId: string; role: string; roleId: number; empresaId?: string },
  ) {
    const caller: CallerContext = this.buildCaller(user);
    const result = await this.updateRole.execute({
      id,
      name: body.name,
      description: body.description,
      caller,
    });
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  // ── Delete Role ───────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; role: string; roleId: number; empresaId?: string },
  ) {
    const caller: CallerContext = this.buildCaller(user);
    const result = await this.deleteRole.execute({ id, caller });
    if (result.isErr()) throw result.unwrapErr();
  }

  // ── Private Helpers ───────────────────────────────────────────────

  private buildCaller(user: { userId: string; role: string; roleId: number; empresaId?: string }): CallerContext {
    return {
      callerId: user.userId,
      callerRole: user.role,
      callerRoleId: user.roleId,
      callerEmpresaId: user.empresaId ?? '00000000-0000-0000-0000-000000000001',
    };
  }
}
