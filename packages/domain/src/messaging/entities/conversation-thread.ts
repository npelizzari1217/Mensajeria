import { Subject } from '../../shared/value-objects/subject';
import { ThreadId } from '../value-objects/thread-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';
import { Message } from './message';

/**
 * ConversationThread entity.
 *
 * Groups related messages (replies) into a conversation.
 * A thread is created when the first message in a conversation is sent,
 * or an existing thread can be referenced by parentMessageId chains.
 */
export class ConversationThread {
  private constructor(
    private readonly id: ThreadId,
    private subject: Subject,
    private messageCount: number,
    private readonly createdAt: Timestamp,
    private updatedAt: Timestamp,
  ) {}

  static create(subject: Subject): ConversationThread {
    return new ConversationThread(
      ThreadId.reconstruct(crypto.randomUUID()),
      subject,
      0,
      Timestamp.now(),
      Timestamp.now(),
    );
  }

  static reconstruct(props: ConversationThreadProps): ConversationThread {
    return new ConversationThread(
      props.id,
      props.subject,
      props.messageCount,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Identity ---

  getId(): ThreadId {
    return this.id;
  }

  getSubject(): Subject {
    return this.subject;
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  // --- Behavior ---

  /**
   * Increments message count when a new message is added to this thread.
   */
  addMessage(): void {
    this.messageCount += 1;
    this.updatedAt = Timestamp.now();
  }

  /**
   * Updates the thread subject.
   */
  changeSubject(subject: Subject): void {
    this.subject = subject;
    this.updatedAt = Timestamp.now();
  }

  equals(other: ConversationThread): boolean {
    return this.id.equals(other.id);
  }
}

export interface ConversationThreadProps {
  id: ThreadId;
  subject: Subject;
  messageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
