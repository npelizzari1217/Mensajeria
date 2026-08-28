import {
  User,
  UserId,
  EmpresaId,
  EmpresaMembership,
  Email,
  UserRepository,
  Result,
  ok,
  err,
  UserNotFoundError,
  DomainError,
  Timestamp,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { User as PrismaUser } from '@prisma/client';

/**
 * PrismaUserRepository — infrastructure adapter implementing UserRepository.
 *
 * Uses PrismaService for database access.
 * Mappers are now inline — no external user-mapper.ts dependency.
 * Role is stored as a numeric roleId (Int FK to roles table), not an enum.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Inline mappers (replaces UserMapper) ---

  /**
   * Maps a Prisma User row to a domain User entity.
   * Uses reconstruct() since DB data is trusted.
   * roleId is the numeric FK — no Role enum conversion needed.
   */
  private toDomain(row: PrismaUser): User {
    return User.reconstruct({
      id: UserId.reconstruct(row.id),
      email: Email.reconstruct(row.email),
      name: row.name,
      roleId: row.roleId,
      hashedPassword: row.password,
      createdAt: Timestamp.reconstruct(row.createdAt.toISOString()),
      updatedAt: Timestamp.reconstruct(row.updatedAt.toISOString()),
    });
  }

  /**
   * Converts a domain User to a Prisma-compatible plain object.
   * Uses Prisma model field names (not @map column names).
   */
  private toPrismaData(user: User) {
    return {
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      roleId: user.getRoleId(),
      password: user.getHashedPassword(),
      createdAt: new Date(user.getCreatedAt().get()),
      updatedAt: new Date(user.getUpdatedAt().get()),
    };
  }

  // --- Repository methods ---

  async findById(id: UserId): Promise<Result<User, DomainError>> {
    const row = await this.prisma.user.findUnique({
      where: { id: id.get() },
    });
    if (!row) {
      return err(new UserNotFoundError(id.get()));
    }
    return ok(this.toDomain(row));
  }

  async findByEmail(email: Email): Promise<Result<User, DomainError>> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.get() },
    });
    if (!row) {
      return err(new UserNotFoundError(email.get()));
    }
    return ok(this.toDomain(row));
  }

  async save(user: User): Promise<Result<void, DomainError>> {
    const data = this.toPrismaData(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        password: data.password,
        updatedAt: data.updatedAt,
      },
    });
    return ok(undefined);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.get() },
    });
    return count > 0;
  }

  async findAll(): Promise<Result<User[], DomainError>> {
    const rows = await this.prisma.user.findMany({
      orderBy: { name: 'asc' },
    });
    return ok(rows.map((row) => this.toDomain(row)));
  }

  async delete(id: UserId): Promise<Result<void, DomainError>> {
    await this.prisma.user.delete({
      where: { id: id.get() },
    });
    return ok(undefined);
  }

  async getEmpresas(userId: UserId): Promise<Result<EmpresaMembership[], DomainError>> {
    const rows = await this.prisma.userEmpresa.findMany({
      where: { userId: userId.get() },
      include: { empresa: true },
    });
    const memberships: EmpresaMembership[] = rows.map((r) => ({
      empresaId: EmpresaId.reconstruct(r.empresaId),
      nombre: r.empresa.nombre,
      roleId: r.roleId,
      isActive: r.isActive,
    }));
    return ok(memberships);
  }

  async isMemberOf(userId: UserId, empresaId: EmpresaId): Promise<boolean> {
    const count = await this.prisma.userEmpresa.count({
      where: {
        userId: userId.get(),
        empresaId: empresaId.get(),
        isActive: true,
      },
    });
    return count > 0;
  }

  async addToEmpresa(
    userId: UserId,
    empresaId: EmpresaId,
    roleId: number,
  ): Promise<Result<void, DomainError>> {
    await this.prisma.userEmpresa.create({
      data: {
        userId: userId.get(),
        empresaId: empresaId.get(),
        roleId,
        isActive: true,
      },
    });
    return ok(undefined);
  }

  async findAllByEmpresaId(
    empresaId: EmpresaId,
    roleId?: number,
  ): Promise<Result<User[], DomainError>> {
    const where: Record<string, unknown> = {
      empresaId: empresaId.get(),
      isActive: true,
    };
    if (roleId !== undefined) {
      where.roleId = roleId;
    }
    const memberships = await this.prisma.userEmpresa.findMany({
      where,
      include: { user: true },
    });
    return ok(memberships.map((m) => this.toDomain(m.user)));
  }
}
