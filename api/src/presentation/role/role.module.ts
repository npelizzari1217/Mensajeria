import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { RoleController } from './role.controller';
import { PrismaRoleRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-role.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { CreateRoleUseCase } from '../../application/role/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '../../application/role/use-cases/update-role.use-case';
import { DeleteRoleUseCase } from '../../application/role/use-cases/delete-role.use-case';
import { ListRolesUseCase } from '../../application/role/use-cases/list-roles.use-case';

@Module({
  imports: [AuthModule],
  controllers: [RoleController],
  providers: [
    Reflector,
    RolesGuard,

    // ── Infrastructure: Repository ───────────────────────────────────
    {
      provide: PrismaRoleRepository,
      useFactory: (prisma: PrismaService) => new PrismaRoleRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'RoleRepository',
      useExisting: PrismaRoleRepository,
    },

    // ── Application: Use Cases ──────────────────────────────────────
    {
      provide: CreateRoleUseCase,
      useFactory: (repo) => new CreateRoleUseCase(repo),
      inject: ['RoleRepository'],
    },
    {
      provide: UpdateRoleUseCase,
      useFactory: (repo) => new UpdateRoleUseCase(repo),
      inject: ['RoleRepository'],
    },
    {
      provide: DeleteRoleUseCase,
      useFactory: (repo) => new DeleteRoleUseCase(repo),
      inject: ['RoleRepository'],
    },
    {
      provide: ListRolesUseCase,
      useFactory: (repo) => new ListRolesUseCase(repo),
      inject: ['RoleRepository'],
    },
  ],
})
export class RoleModule {}
