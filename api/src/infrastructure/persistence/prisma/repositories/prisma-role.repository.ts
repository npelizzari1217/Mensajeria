import {
  Role,
  RoleId,
  RoleName,
  RoleRepository,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { Role as PrismaRoleRecord } from '@prisma/client';

/**
 * PrismaRoleRepository — infrastructure adapter implementing RoleRepository.
 *
 * Uses PrismaService for database access.
 * The Role aggregate is now a full entity backed by the `roles` table —
 * no longer a static enum. Persistence is via numeric RoleId.
 */
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Inline mappers ---

  /**
   * Maps a Prisma Role row to a domain Role entity.
   * Uses reconstruct() since DB data is trusted.
   */
  private toDomain(row: PrismaRoleRecord): Role {
    return Role.reconstruct({
      id: RoleId.reconstruct(row.id),
      name: RoleName.reconstruct(row.name),
      description: row.description ?? '',
    });
  }

  // --- Repository methods ---

  async findById(id: RoleId): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({
      where: { id: id.get() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: RoleName): Promise<Role | null> {
    const row = await this.prisma.role.findUnique({
      where: { name: name.get() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Role[]> {
    const rows = await this.prisma.role.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(role: Role): Promise<void> {
    await this.prisma.role.upsert({
      where: { id: role.id.get() },
      create: {
        id: role.id.get(),
        name: role.getName().get(),
        description: role.getDescription(),
      },
      update: {
        name: role.getName().get(),
        description: role.getDescription(),
      },
    });
  }

  async delete(id: RoleId): Promise<void> {
    await this.prisma.role.delete({
      where: { id: id.get() },
    });
  }

  async hasUsers(id: RoleId): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { roleId: id.get() },
    });
    return count > 0;
  }
}
