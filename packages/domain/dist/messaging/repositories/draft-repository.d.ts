import { Result } from '../../shared/result';
import { Draft } from '../entities/draft';
/**
 * Repository port for Draft entities.
 *
 * Defined in domain — implementation in infrastructure (PrismaDraftRepository).
 * All methods return `Result<T, Error>` — never throw.
 */
export interface DraftRepository {
    save(draft: Draft): Promise<Result<void, Error>>;
    findById(id: string): Promise<Result<Draft | null, Error>>;
    findByUserId(userId: string): Promise<Result<Draft[], Error>>;
    update(draft: Draft): Promise<Result<void, Error>>;
    delete(id: string): Promise<Result<void, Error>>;
}
//# sourceMappingURL=draft-repository.d.ts.map