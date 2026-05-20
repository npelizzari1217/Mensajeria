import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@mensajeria/domain';
import { CreateEmpresaUseCase } from '../../application/empresas/use-cases/create-empresa.use-case';
import { ListEmpresasUseCase } from '../../application/empresas/use-cases/list-empresas.use-case';
import { GetEmpresaUseCase } from '../../application/empresas/use-cases/get-empresa.use-case';
import { UpdateEmpresaUseCase } from '../../application/empresas/use-cases/update-empresa.use-case';
import { DeleteEmpresaUseCase } from '../../application/empresas/use-cases/delete-empresa.use-case';
import { AssignUserToEmpresaUseCase } from '../../application/empresas/use-cases/assign-user-to-empresa.use-case';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { CreateEmpresaRequest } from './dto/create-empresa.request';
import { UpdateEmpresaRequest } from './dto/update-empresa.request';
import { AssignUserRequest } from './dto/assign-user.request';

/**
 * EmpresasController — REST endpoints for empresa management.
 *
 * ALL endpoints require Admin role.
 * Errors are mapped via AppExceptionFilter.
 */
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly createEmpresaUseCase: CreateEmpresaUseCase,
    private readonly listEmpresasUseCase: ListEmpresasUseCase,
    private readonly getEmpresaUseCase: GetEmpresaUseCase,
    private readonly updateEmpresaUseCase: UpdateEmpresaUseCase,
    private readonly deleteEmpresaUseCase: DeleteEmpresaUseCase,
    private readonly assignUserToEmpresaUseCase: AssignUserToEmpresaUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateEmpresaRequest) {
    const result = await this.createEmpresaUseCase.execute({ nombre: body.nombre });
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async list() {
    const result = await this.listEmpresasUseCase.execute();
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async getOne(@Param('id') id: string) {
    const result = await this.getEmpresaUseCase.execute(id);
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  async update(@Param('id') id: string, @Body() body: UpdateEmpresaRequest) {
    const result = await this.updateEmpresaUseCase.execute(id, { nombre: body.nombre });
    if (result.isErr()) throw result.unwrapErr();
    return { data: result.unwrap() };
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    const result = await this.deleteEmpresaUseCase.execute(id);
    if (result.isErr()) throw result.unwrapErr();
  }

  @Post(':id/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  async assignUser(@Param('id') empresaId: string, @Body() body: AssignUserRequest) {
    const result = await this.assignUserToEmpresaUseCase.execute(empresaId, {
      userId: body.userId,
      role: body.role,
    });
    if (result.isErr()) throw result.unwrapErr();
    return { data: { message: 'User assigned successfully' } };
  }
}
