import { User, UserId, Email, Role, RoleVO, Timestamp } from '@mensajeria/domain';
import { User as PrismaUser, Role as PrismaRole } from '@prisma/client';

/**
 * Maps a domain Role to Prisma Role enum.
 */
function toPrismaRole(role: Role): PrismaRole {
  const map: Record<Role, PrismaRole> = {
    [Role.Admin]: PrismaRole.ADMIN,
    [Role.Supervisor]: PrismaRole.SUPERVISOR,
    [Role.Tecnico]: PrismaRole.TECNICO,
    [Role.Usuario]: PrismaRole.USUARIO,
  };
  return map[role];
}

/**
 * Maps a Prisma Role to domain Role.
 */
function toDomainRole(role: PrismaRole): Role {
  const map: Record<PrismaRole, Role> = {
    [PrismaRole.ADMIN]: Role.Admin,
    [PrismaRole.SUPERVISOR]: Role.Supervisor,
    [PrismaRole.TECNICO]: Role.Tecnico,
    [PrismaRole.USUARIO]: Role.Usuario,
  };
  return map[role];
}

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
      role: RoleVO.reconstruct(toDomainRole(prismaUser.role)),
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
    role: PrismaRole;
    password: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: toPrismaRole(user.getRole().get()),
      password: user.getHashedPassword(),
      createdAt: new Date(user.getCreatedAt().get()),
      updatedAt: new Date(user.getUpdatedAt().get()),
    };
  }
}
