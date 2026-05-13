import {
  User,
  UserId,
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
}
