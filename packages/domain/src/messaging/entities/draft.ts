import { UserId } from '../../shared/value-objects/user-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';
import crypto from 'crypto';

/**
 * Draft entity — a message that hasn't been sent yet.
 *
 * Users can save drafts before sending. Drafts are per-user and
 * can have recipients assigned or just subject/body while composing.
 */
export class Draft {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private subject: string | null,
    private body: string,
    private readonly recipientIds: string[],
    private readonly groupId: string | null,
    private readonly createdAt: Timestamp,
    private updatedAt: Timestamp,
  ) {}

  /**
   * Factory for NEW drafts.
   */
  static create(props: DraftCreateProps): Result<Draft, Error> {
    if (!props.body || props.body.trim().length === 0) {
      return err(new Error('Draft body is required'));
    }

    const id = crypto.randomUUID();
    const now = Timestamp.now();

    return ok(
      new Draft(
        id,
        props.userId,
        props.subject ?? null,
        props.body.trim(),
        props.recipientIds ?? [],
        props.groupId ?? null,
        now,
        now,
      ),
    );
  }

  /**
   * Reconstruction from persistence.
   */
  static reconstruct(props: DraftProps): Draft {
    return new Draft(
      props.id,
      props.userId,
      props.subject,
      props.body,
      props.recipientIds,
      props.groupId,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Identity ---

  getId(): string {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getSubject(): string | null {
    return this.subject;
  }

  getBody(): string {
    return this.body;
  }

  getRecipientIds(): readonly string[] {
    return [...this.recipientIds];
  }

  getGroupId(): string | null {
    return this.groupId;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  // --- Behavior ---

  /**
   * Updates draft fields. Returns a new Draft with the merged values.
   * The original draft is not mutated (immutable).
   */
  update(props: Partial<DraftUpdateProps>): Draft {
    return new Draft(
      this.id,
      this.userId,
      props.subject !== undefined ? props.subject : this.subject,
      props.body !== undefined ? props.body : this.body,
      props.recipientIds !== undefined ? props.recipientIds : [...this.recipientIds],
      props.groupId !== undefined ? props.groupId : this.groupId,
      this.createdAt,
      Timestamp.now(),
    );
  }

  /**
   * Returns true if this draft has all required fields to be sent.
   */
  canBeSent(): boolean {
    return this.body.trim().length > 0
      && (this.recipientIds.length > 0 || this.groupId !== null);
  }

  equals(other: Draft): boolean {
    return this.id === other.id;
  }
}

export interface DraftCreateProps {
  userId: UserId;
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
  subject: string | null;
  body: string;
  recipientIds: string[];
  groupId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
