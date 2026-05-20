import {
  Empresa,
  EmpresaId,
  EmpresaRepository,
  EmpresaNotFoundError,
  Result,
  ok,
  err,
  DomainError,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { EmpresaMapper } from '../mappers/empresa-mapper';

/**
 * PrismaEmpresaRepository — infrastructure adapter implementing EmpresaRepository.
 *
 * Uses PrismaService for database access and EmpresaMapper for conversions.
 */
export class PrismaEmpresaRepository implements EmpresaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: EmpresaId): Promise<Result<Empresa, DomainError>> {
    const row = await this.prisma.empresa.findUnique({
      where: { id: id.get() },
    });
    if (!row) {
      return err(new EmpresaNotFoundError(id.get()));
    }
    return ok(EmpresaMapper.toDomain(row));
  }

  async findAll(): Promise<Result<Empresa[], DomainError>> {
    const rows = await this.prisma.empresa.findMany({
      orderBy: { nombre: 'asc' },
    });
    return ok(rows.map(EmpresaMapper.toDomain));
  }

  async save(empresa: Empresa): Promise<Result<void, DomainError>> {
    const data = EmpresaMapper.toPrisma(empresa);
    await this.prisma.empresa.upsert({
      where: { id: data.id },
      create: { id: data.id, nombre: data.nombre },
      update: { nombre: data.nombre, updatedAt: data.updatedAt },
    });
    return ok(undefined);
  }

  async delete(id: EmpresaId): Promise<Result<void, DomainError>> {
    await this.prisma.empresa.delete({
      where: { id: id.get() },
    });
    return ok(undefined);
  }

  async existsByNombre(nombre: string): Promise<boolean> {
    const count = await this.prisma.empresa.count({
      where: { nombre },
    });
    return count > 0;
  }
}
