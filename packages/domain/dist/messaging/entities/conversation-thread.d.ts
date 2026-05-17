import { Subject } from '../../shared/value-objects/subject';
import { ThreadId } from '../value-objects/thread-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
/**
 * ConversationThread entity.
 *
 * Groups related messages (replies) into a conversation.
 * A thread is created when the first message in a conversation is sent,
 * or an existing thread can be referenced by parentMessageId chains.
 */
export declare class ConversationThread {
    private readonly id;
    private subject;
    private messageCount;
    private readonly createdAt;
    private updatedAt;
    private constructor();
    static create(subject: Subject): ConversationThread;
    static reconstruct(props: ConversationThreadProps): ConversationThread;
    getId(): ThreadId;
    getSubject(): Subject;
    getMessageCount(): number;
    getCreatedAt(): Timestamp;
    getUpdatedAt(): Timestamp;
    /**
     * Increments message count when a new message is added to this thread.
     */
    addMessage(): void;
    /**
     * Updates the thread subject.
     */
    changeSubject(subject: Subject): void;
    equals(other: ConversationThread): boolean;
}
export interface ConversationThreadProps {
    id: ThreadId;
    subject: Subject;
    messageCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
//# sourceMappingURL=conversation-thread.d.ts.map