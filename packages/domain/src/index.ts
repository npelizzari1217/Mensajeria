// Shared
export { Result, Ok, Err, ok, err } from './shared/result';
export { DomainError } from './shared/errors/domain-error';
export { NotFoundError } from './shared/errors/not-found-error';
export { StorageError } from './shared/errors/storage-error';
export { ValidationError } from './shared/errors/validation-error';
export { DomainEvent } from './shared/events/domain-event';
export { EventBus, EventHandler } from './shared/event-bus';

// Shared Value Objects
export { UserId } from './shared/value-objects/user-id';
export { MessageId } from './shared/value-objects/message-id';
export { FileId } from './shared/value-objects/file-id';
export { Email } from './shared/value-objects/email';
export { Role, RoleVO } from './shared/value-objects/role';
export { Subject } from './shared/value-objects/subject';
export { MessageBody } from './shared/value-objects/message-body';
export { MessageStatus, MessageStatusVO } from './shared/value-objects/message-status';
export { Timestamp } from './shared/value-objects/timestamp';

// Auth
export { Password } from './auth/value-objects/password';
export { UserIdentity } from './auth/value-objects/user-identity';
export { User } from './auth/entities/user';
export { UserRegistered } from './auth/events/user-registered';
export { UserRepository } from './auth/repositories/user-repository';
export { RefreshTokenRepository, RefreshTokenRecord } from './auth/repositories/refresh-token-repository';

// Auth Errors
export { UserNotFoundError, EmailAlreadyExistsError, InvalidCredentialsError } from './auth/errors/user.errors';

// Messaging Value Objects
export { ThreadId } from './messaging/value-objects/thread-id';

// Messaging Entities
export { Message } from './messaging/entities/message';
export { MessageRecipient } from './messaging/entities/message-recipient';
export { ConversationThread } from './messaging/entities/conversation-thread';
export { Attachment } from './messaging/entities/attachment';

// Messaging Events
export { MessageSent } from './messaging/events/message-sent';
export { MessageRead } from './messaging/events/message-read';

// Messaging Repositories
export { MessageRepository } from './messaging/repositories/message-repository';
export type { PaginationParams, PaginatedResult } from './messaging/repositories/message-repository';
export { AttachmentRepository } from './messaging/repositories/attachment-repository';

// Messaging Ports
export type { IFileStorage } from './messaging/ports/file-storage';

// Messaging Errors
export { MessageNotFoundError, UnauthorizedMessageAccessError } from './messaging/errors/message.errors';
