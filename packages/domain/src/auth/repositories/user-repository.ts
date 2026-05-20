import { User } from '../entities/user';
import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/errors/domain-error';

/**
 * UserRepository port.
 *
 * Defines the contract for persisting and retrieving User aggregates.
 * Implementation belongs in infrastructure/ (PrismaUserRepository).
 *
 * All methods return `Result<T, DomainError>` — never throw.
 */
export interface UserRepository {
  /**
   * Finds a user by their unique ID.
   * Returns UserNotFoundError if not found.
   */
  findById(id: UserId): Promise<Result<User, DomainError>>;

  /**
   * Finds a user by email (case-insensitive).
   * Returns UserNotFoundError if not found.
   */
  findByEmail(email: Email): Promise<Result<User, DomainError>>;

  /**
   * Persists a user (create or update).
   */
  save(user: User): Promise<Result<void, DomainError>>;

  /**
   * Checks if a user with the given email already exists.
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Returns all users (for contact lists).
   */
  findAll(): Promise<Result<User[], DomainError>>;

  /**
   * Deletes a user by ID.
   */
  delete(id: UserId): Promise<Result<void, DomainError>>;

  getEmpresas(userId: UserId): Promise<Result<EmpresaMembership[], DomainError>>;

  isMemberOf(userId: UserId, empresaId: EmpresaId): Promise<boolean>;

  addToEmpresa(userId: UserId, empresaId: EmpresaId, role: string): Promise<Result<void, DomainError>>;

  /**
   * Finds all users that belong to a given empresa.
   */
  findAllByEmpresaId(empresaId: EmpresaId): Promise<Result<User[], DomainError>>;
}

export interface EmpresaMembership {
  empresaId: EmpresaId;
  nombre: string;
  role: string;
  isActive: boolean;
}
