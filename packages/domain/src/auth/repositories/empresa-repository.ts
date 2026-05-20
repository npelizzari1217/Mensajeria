import { Empresa } from '../entities/empresa';
import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/errors/domain-error';

/**
 * EmpresaRepository port.
 *
 * Defines the contract for persisting and retrieving Empresa aggregates.
 * Implementation belongs in infrastructure/ (PrismaEmpresaRepository).
 *
 * All methods return `Result<T, DomainError>` — never throw.
 */
export interface EmpresaRepository {
  /**
   * Finds an empresa by its unique ID.
   * Returns EmpresaNotFoundError if not found.
   */
  findById(id: EmpresaId): Promise<Result<Empresa, DomainError>>;

  /**
   * Returns all empresas.
   */
  findAll(): Promise<Result<Empresa[], DomainError>>;

  /**
   * Persists an empresa (create or update).
   */
  save(empresa: Empresa): Promise<Result<void, DomainError>>;

  /**
   * Deletes an empresa by ID.
   */
  delete(id: EmpresaId): Promise<Result<void, DomainError>>;

  /**
   * Checks if an empresa with the given name already exists.
   */
  existsByNombre(nombre: string): Promise<boolean>;
}
