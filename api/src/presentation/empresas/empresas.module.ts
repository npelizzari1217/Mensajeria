import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { EmpresasController } from './empresas.controller';
import { PrismaEmpresaRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-empresa.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';
import { CreateEmpresaUseCase } from '../../application/empresas/use-cases/create-empresa.use-case';
import { ListEmpresasUseCase } from '../../application/empresas/use-cases/list-empresas.use-case';
import { GetEmpresaUseCase } from '../../application/empresas/use-cases/get-empresa.use-case';
import { UpdateEmpresaUseCase } from '../../application/empresas/use-cases/update-empresa.use-case';
import { DeleteEmpresaUseCase } from '../../application/empresas/use-cases/delete-empresa.use-case';
import { AssignUserToEmpresaUseCase } from '../../application/empresas/use-cases/assign-user-to-empresa.use-case';

@Module({
  imports: [AuthModule],
  controllers: [EmpresasController],
  providers: [
    Reflector,
    RolesGuard,

    // ── Infrastructure: Repository ───────────────────────────────────
    {
      provide: PrismaEmpresaRepository,
      useFactory: (prisma: PrismaService) => new PrismaEmpresaRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'EmpresaRepository',
      useExisting: PrismaEmpresaRepository,
    },

    // ── Application: Use Cases ──────────────────────────────────────
    {
      provide: CreateEmpresaUseCase,
      useFactory: (repo) => new CreateEmpresaUseCase(repo),
      inject: ['EmpresaRepository'],
    },
    {
      provide: ListEmpresasUseCase,
      useFactory: (repo) => new ListEmpresasUseCase(repo),
      inject: ['EmpresaRepository'],
    },
    {
      provide: GetEmpresaUseCase,
      useFactory: (repo) => new GetEmpresaUseCase(repo),
      inject: ['EmpresaRepository'],
    },
    {
      provide: UpdateEmpresaUseCase,
      useFactory: (repo) => new UpdateEmpresaUseCase(repo),
      inject: ['EmpresaRepository'],
    },
    {
      provide: DeleteEmpresaUseCase,
      useFactory: (repo) => new DeleteEmpresaUseCase(repo),
      inject: ['EmpresaRepository'],
    },
    {
      provide: AssignUserToEmpresaUseCase,
      useFactory: (userRepo, empresaRepo) =>
        new AssignUserToEmpresaUseCase(userRepo, empresaRepo),
      inject: ['UserRepository', 'EmpresaRepository'],
    },
  ],
})
export class EmpresasModule {}
