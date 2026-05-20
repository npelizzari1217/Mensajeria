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
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { UserMapper } from '../mappers/user-mapper';

/**
 * PrismaUserRepository — infrastructure adapter implementing UserRepository.
 *
 * Uses PrismaService for database access and UserMapper for conversions.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<Result<User, DomainError>> {
    const row = await this.prisma.user.findUnique({
      where: { id: id.get() },
    });
    if (!row) {
      return err(new UserNotFoundError(id.get()));
    }
    return ok(UserMapper.toDomain(row));
  }

  async findByEmail(email: Email): Promise<Result<User, DomainError>> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.get() },
    });
    if (!row) {
      return err(new UserNotFoundError(email.get()));
    }
    return ok(UserMapper.toDomain(row));
  }

  async save(user: User): Promise<Result<void, DomainError>> {
    const data = UserMapper.toPrisma(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: {
        email: data.email,
        name: data.name,
        role: data.role,
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
    return ok(rows.map((row) => UserMapper.toDomain(row)));
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
      role: r.role,
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

  async addToEmpresa(userId: UserId, empresaId: EmpresaId, role: string): Promise<Result<void, DomainError>> {
    await this.prisma.userEmpresa.create({
      data: {
        userId: userId.get(),
        empresaId: empresaId.get(),
        role: role as any,
        isActive: true,
      },
    });
    return ok(undefined);
  }

  async findAllByEmpresaId(empresaId: EmpresaId): Promise<Result<User[], DomainError>> {
    const memberships = await this.prisma.userEmpresa.findMany({
      where: { empresaId: empresaId.get(), isActive: true },
      include: { user: true },
    });
    return ok(memberships.map((m) => UserMapper.toDomain(m.user)));
  }
}
