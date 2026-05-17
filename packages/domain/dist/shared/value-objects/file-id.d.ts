import { Result } from '../result';
/**
 * FileId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a file attachment.
 * Unlike UserId/MessageId, create() generates a new UUID — consumers
 * do not supply their own ID; the domain owns identity generation.
 */
export declare class FileId {
    private readonly value;
    private constructor();
    /**
     * Factory for NEW file identities.
     * Generates a cryptographically random UUID v4 — no input needed.
     */
    static create(): FileId;
    /**
     * Factory for NEW file identities from a provided UUID string.
     * Validates the format before constructing.
     */
    static createFrom(raw: string): Result<FileId, Error>;
    /**
     * Trusted reconstruction for persistence — skips validation.
     * Use ONLY when restoring from a trusted source (DB, event store).
     */
    static reconstruct(raw: string): FileId;
    get(): string;
    equals(other: FileId): boolean;
    toString(): string;
}
//# sourceMappingURL=file-id.d.ts.map