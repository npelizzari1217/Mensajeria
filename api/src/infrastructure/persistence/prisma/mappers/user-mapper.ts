import { User, UserId, Email, RoleVO, Timestamp } from '@mensajeria/domain';
import { User as PrismaUser, Role } from '@prisma/client';

/**
 * UserMapper — converts between Prisma User model and domain User entity.
 *
 * Stateless — call static methods directly.
 * toDomain: Prisma → Domain (uses reconstruct for trusted DB data)
 * toPrisma: Domain → Prisma create input
 */
export class UserMapper {
  /**
   * Converts a Prisma User to a domain User entity.
   * Uses reconstruct() since DB data is trusted.
   */
  static toDomain(prismaUser: PrismaUser): User {
    return User.reconstruct({
      id: UserId.reconstruct(prismaUser.id),
      email: Email.reconstruct(prismaUser.email),
      name: prismaUser.name,
      role: RoleVO.reconstruct(prismaUser.role),
      hashedPassword: prismaUser.password,
      createdAt: Timestamp.reconstruct(prismaUser.createdAt.toISOString()),
      updatedAt: Timestamp.reconstruct(prismaUser.updatedAt.toISOString()),
    });
  }

  /**
   * Converts a domain User to Prisma-compatible data.
   * Uses the model field names (not @map column names).
   */
  static toPrisma(user: User): {
    id: string;
    email: string;
    name: string;
    role: Role;
    password: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get() as Role,
      password: user.getHashedPassword(),
      createdAt: new Date(user.getCreatedAt().get()),
      updatedAt: new Date(user.getUpdatedAt().get()),
    };
  }
}
