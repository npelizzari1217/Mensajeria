import { Empresa, EmpresaId, Timestamp } from '@mensajeria/domain';
import { Empresa as PrismaEmpresa } from '@prisma/client';

/**
 * EmpresaMapper — converts between Prisma Empresa model and domain Empresa entity.
 *
 * Stateless — call static methods directly.
 * toDomain: Prisma → Domain (uses reconstruct for trusted DB data)
 * toPrisma: Domain → Prisma create/update input
 */
export class EmpresaMapper {
  /**
   * Converts a Prisma Empresa to a domain Empresa entity.
   * Uses reconstruct() since DB data is trusted.
   */
  static toDomain(prismaEmpresa: PrismaEmpresa): Empresa {
    return Empresa.reconstruct({
      id: EmpresaId.reconstruct(prismaEmpresa.id),
      nombre: prismaEmpresa.nombre,
      createdAt: Timestamp.reconstruct(prismaEmpresa.createdAt.toISOString()),
      updatedAt: Timestamp.reconstruct(prismaEmpresa.updatedAt.toISOString()),
    });
  }

  /**
   * Converts a domain Empresa to Prisma-compatible data.
   * Only includes fields needed for create/update (createdAt has @default(now()) in schema).
   */
  static toPrisma(empresa: Empresa): {
    id: string;
    nombre: string;
    updatedAt: Date;
  } {
    return {
      id: empresa.getId().get(),
      nombre: empresa.getNombre(),
      updatedAt: new Date(empresa.getUpdatedAt().toString()),
    };
  }
}
