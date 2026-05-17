import { DomainError } from '../../shared/errors/domain-error';
/**
 * Error when a draft is not found by ID.
 */
export declare class DraftNotFoundError extends DomainError {
    readonly code = "DRAFT_NOT_FOUND";
    constructor(id: string);
}
//# sourceMappingURL=draft.errors.d.ts.map