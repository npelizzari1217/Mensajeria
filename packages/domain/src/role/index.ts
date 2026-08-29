// Value Objects
export { RoleId } from './value-objects/role-id';
export { RoleName } from './value-objects/role-name';

// Entities
export { Role } from './entities/role';
export type { CreateRoleProps, RoleProps } from './entities/role';

// Repositories
export type { RoleRepository } from './repositories/role-repository';

// Errors
export { RoleNameAlreadyExistsError, RoleHasUsersError } from './errors/role.errors';
