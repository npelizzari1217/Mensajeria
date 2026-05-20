import { Result } from '../../shared/result';
import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { Draft } from '../entities/draft';

/**
 * Repository port for Draft entities.
 *
 * Defined in domain — implementation in infrastructure (PrismaDraftRepository).
 * All methods return `Result<T, Error>` — never throw.
 */
export interface DraftRepository {
  save(draft: Draft): Promise<Result<void, Error>>;
  findById(id: string, empresaId: EmpresaId): Promise<Result<Draft | null, Error>>;
  findByUserId(userId: string, empresaId: EmpresaId): Promise<Result<Draft[], Error>>;
  update(draft: Draft): Promise<Result<void, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}
