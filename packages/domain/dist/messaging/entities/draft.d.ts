import { UserId } from '../../shared/value-objects/user-id';
import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result } from '../../shared/result';
/**
 * Draft entity — a message that hasn't been sent yet.
 *
 * Users can save drafts before sending. Drafts are per-user and
 * can have recipients assigned or just subject/body while composing.
 */
export declare class Draft {
    private readonly id;
    private readonly userId;
    private readonly empresaId;
    private subject;
    private body;
    private readonly recipientIds;
    private readonly groupId;
    private readonly createdAt;
    private updatedAt;
    private constructor();
    /**
     * Factory for NEW drafts.
     */
    static create(props: DraftCreateProps): Result<Draft, Error>;
    /**
     * Reconstruction from persistence.
     */
    static reconstruct(props: DraftProps): Draft;
    getId(): string;
    getUserId(): UserId;
    getEmpresaId(): EmpresaId;
    getSubject(): string | null;
    getBody(): string;
    getRecipientIds(): readonly string[];
    getGroupId(): string | null;
    getCreatedAt(): Timestamp;
    getUpdatedAt(): Timestamp;
    /**
     * Updates draft fields. Returns a new Draft with the merged values.
     * The original draft is not mutated (immutable).
     */
    update(props: Partial<DraftUpdateProps>): Draft;
    /**
     * Returns true if this draft has all required fields to be sent.
     */
    canBeSent(): boolean;
    equals(other: Draft): boolean;
}
export interface DraftCreateProps {
    userId: UserId;
    empresaId: EmpresaId;
    subject?: string | null;
    body: string;
    recipientIds?: string[];
    groupId?: string | null;
}
export interface DraftUpdateProps {
    subject: string | null;
    body: string;
    recipientIds: string[];
    groupId: string | null;
}
export interface DraftProps {
    id: string;
    userId: UserId;
    empresaId: EmpresaId;
    subject: string | null;
    body: string;
    recipientIds: string[];
    groupId: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
//# sourceMappingURL=draft.d.ts.map