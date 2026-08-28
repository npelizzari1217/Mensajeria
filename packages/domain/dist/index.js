"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.Draft = exports.GroupMemberRemoved = exports.GroupMemberAdded = exports.GroupCreated = exports.GroupMember = exports.Group = exports.ForwardedContent = exports.GroupRole = exports.MessageRead = exports.MessageSent = exports.Attachment = exports.ConversationThread = exports.MessageRecipient = exports.Message = exports.ThreadId = exports.ForbiddenDomainError = exports.EmpresaNameAlreadyExistsError = exports.EmpresaNotFoundError = exports.InvalidCredentialsError = exports.EmailAlreadyExistsError = exports.UserNotFoundError = exports.UserRegistered = exports.Empresa = exports.User = exports.UserIdentity = exports.Password = exports.EmpresaId = exports.Timestamp = exports.MessageStatusVO = exports.MessageStatus = exports.MessageBody = exports.Subject = exports.USUARIO_ROLE_ID = exports.TECNICO_ROLE_ID = exports.SUPERVISOR_ROLE_ID = exports.ADMIN_ROLE_ID = exports.RoleVO = exports.Email = exports.FileId = exports.MessageId = exports.UserId = exports.ValidationError = exports.StorageError = exports.NotFoundError = exports.DomainError = exports.err = exports.ok = exports.Err = exports.Ok = void 0;
exports.DraftNotFoundError = exports.GroupAlreadyExistsError = exports.NotGroupAdminError = exports.NotGroupMemberError = exports.GroupNotFoundError = exports.UnauthorizedMessageAccessError = exports.MessageNotFoundError = exports.RoleHasUsersError = exports.RoleNameAlreadyExistsError = exports.RoleName = exports.RoleId = void 0;
// Shared
var result_1 = require("./shared/result");
Object.defineProperty(exports, "Ok", { enumerable: true, get: function () { return result_1.Ok; } });
Object.defineProperty(exports, "Err", { enumerable: true, get: function () { return result_1.Err; } });
Object.defineProperty(exports, "ok", { enumerable: true, get: function () { return result_1.ok; } });
Object.defineProperty(exports, "err", { enumerable: true, get: function () { return result_1.err; } });
var domain_error_1 = require("./shared/errors/domain-error");
Object.defineProperty(exports, "DomainError", { enumerable: true, get: function () { return domain_error_1.DomainError; } });
var not_found_error_1 = require("./shared/errors/not-found-error");
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return not_found_error_1.NotFoundError; } });
var storage_error_1 = require("./shared/errors/storage-error");
Object.defineProperty(exports, "StorageError", { enumerable: true, get: function () { return storage_error_1.StorageError; } });
var validation_error_1 = require("./shared/errors/validation-error");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return validation_error_1.ValidationError; } });
// Shared Value Objects
var user_id_1 = require("./shared/value-objects/user-id");
Object.defineProperty(exports, "UserId", { enumerable: true, get: function () { return user_id_1.UserId; } });
var message_id_1 = require("./shared/value-objects/message-id");
Object.defineProperty(exports, "MessageId", { enumerable: true, get: function () { return message_id_1.MessageId; } });
var file_id_1 = require("./shared/value-objects/file-id");
Object.defineProperty(exports, "FileId", { enumerable: true, get: function () { return file_id_1.FileId; } });
var email_1 = require("./shared/value-objects/email");
Object.defineProperty(exports, "Email", { enumerable: true, get: function () { return email_1.Email; } });
var role_1 = require("./shared/value-objects/role");
Object.defineProperty(exports, "RoleVO", { enumerable: true, get: function () { return role_1.RoleVO; } });
Object.defineProperty(exports, "ADMIN_ROLE_ID", { enumerable: true, get: function () { return role_1.ADMIN_ROLE_ID; } });
Object.defineProperty(exports, "SUPERVISOR_ROLE_ID", { enumerable: true, get: function () { return role_1.SUPERVISOR_ROLE_ID; } });
Object.defineProperty(exports, "TECNICO_ROLE_ID", { enumerable: true, get: function () { return role_1.TECNICO_ROLE_ID; } });
Object.defineProperty(exports, "USUARIO_ROLE_ID", { enumerable: true, get: function () { return role_1.USUARIO_ROLE_ID; } });
var subject_1 = require("./shared/value-objects/subject");
Object.defineProperty(exports, "Subject", { enumerable: true, get: function () { return subject_1.Subject; } });
var message_body_1 = require("./shared/value-objects/message-body");
Object.defineProperty(exports, "MessageBody", { enumerable: true, get: function () { return message_body_1.MessageBody; } });
var message_status_1 = require("./shared/value-objects/message-status");
Object.defineProperty(exports, "MessageStatus", { enumerable: true, get: function () { return message_status_1.MessageStatus; } });
Object.defineProperty(exports, "MessageStatusVO", { enumerable: true, get: function () { return message_status_1.MessageStatusVO; } });
var timestamp_1 = require("./shared/value-objects/timestamp");
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return timestamp_1.Timestamp; } });
var empresa_id_1 = require("./shared/value-objects/empresa-id");
Object.defineProperty(exports, "EmpresaId", { enumerable: true, get: function () { return empresa_id_1.EmpresaId; } });
// Auth
var password_1 = require("./auth/value-objects/password");
Object.defineProperty(exports, "Password", { enumerable: true, get: function () { return password_1.Password; } });
var user_identity_1 = require("./auth/value-objects/user-identity");
Object.defineProperty(exports, "UserIdentity", { enumerable: true, get: function () { return user_identity_1.UserIdentity; } });
var user_1 = require("./auth/entities/user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
var empresa_1 = require("./auth/entities/empresa");
Object.defineProperty(exports, "Empresa", { enumerable: true, get: function () { return empresa_1.Empresa; } });
var user_registered_1 = require("./auth/events/user-registered");
Object.defineProperty(exports, "UserRegistered", { enumerable: true, get: function () { return user_registered_1.UserRegistered; } });
// Auth Errors
var user_errors_1 = require("./auth/errors/user.errors");
Object.defineProperty(exports, "UserNotFoundError", { enumerable: true, get: function () { return user_errors_1.UserNotFoundError; } });
Object.defineProperty(exports, "EmailAlreadyExistsError", { enumerable: true, get: function () { return user_errors_1.EmailAlreadyExistsError; } });
Object.defineProperty(exports, "InvalidCredentialsError", { enumerable: true, get: function () { return user_errors_1.InvalidCredentialsError; } });
var empresa_errors_1 = require("./auth/errors/empresa.errors");
Object.defineProperty(exports, "EmpresaNotFoundError", { enumerable: true, get: function () { return empresa_errors_1.EmpresaNotFoundError; } });
Object.defineProperty(exports, "EmpresaNameAlreadyExistsError", { enumerable: true, get: function () { return empresa_errors_1.EmpresaNameAlreadyExistsError; } });
Object.defineProperty(exports, "ForbiddenDomainError", { enumerable: true, get: function () { return empresa_errors_1.ForbiddenDomainError; } });
// Messaging Value Objects
var thread_id_1 = require("./messaging/value-objects/thread-id");
Object.defineProperty(exports, "ThreadId", { enumerable: true, get: function () { return thread_id_1.ThreadId; } });
// Messaging Entities
var message_1 = require("./messaging/entities/message");
Object.defineProperty(exports, "Message", { enumerable: true, get: function () { return message_1.Message; } });
var message_recipient_1 = require("./messaging/entities/message-recipient");
Object.defineProperty(exports, "MessageRecipient", { enumerable: true, get: function () { return message_recipient_1.MessageRecipient; } });
var conversation_thread_1 = require("./messaging/entities/conversation-thread");
Object.defineProperty(exports, "ConversationThread", { enumerable: true, get: function () { return conversation_thread_1.ConversationThread; } });
var attachment_1 = require("./messaging/entities/attachment");
Object.defineProperty(exports, "Attachment", { enumerable: true, get: function () { return attachment_1.Attachment; } });
// Messaging Events
var message_sent_1 = require("./messaging/events/message-sent");
Object.defineProperty(exports, "MessageSent", { enumerable: true, get: function () { return message_sent_1.MessageSent; } });
var message_read_1 = require("./messaging/events/message-read");
Object.defineProperty(exports, "MessageRead", { enumerable: true, get: function () { return message_read_1.MessageRead; } });
// Messaging Value Objects
var group_role_1 = require("./messaging/value-objects/group-role");
Object.defineProperty(exports, "GroupRole", { enumerable: true, get: function () { return group_role_1.GroupRole; } });
var forwarded_content_1 = require("./messaging/value-objects/forwarded-content");
Object.defineProperty(exports, "ForwardedContent", { enumerable: true, get: function () { return forwarded_content_1.ForwardedContent; } });
// Messaging Entities — Groups
var group_1 = require("./messaging/entities/group");
Object.defineProperty(exports, "Group", { enumerable: true, get: function () { return group_1.Group; } });
var group_member_1 = require("./messaging/entities/group-member");
Object.defineProperty(exports, "GroupMember", { enumerable: true, get: function () { return group_member_1.GroupMember; } });
// Messaging Events — Groups
var group_created_1 = require("./messaging/events/group-created");
Object.defineProperty(exports, "GroupCreated", { enumerable: true, get: function () { return group_created_1.GroupCreated; } });
var group_member_added_1 = require("./messaging/events/group-member-added");
Object.defineProperty(exports, "GroupMemberAdded", { enumerable: true, get: function () { return group_member_added_1.GroupMemberAdded; } });
var group_member_removed_1 = require("./messaging/events/group-member-removed");
Object.defineProperty(exports, "GroupMemberRemoved", { enumerable: true, get: function () { return group_member_removed_1.GroupMemberRemoved; } });
// Messaging Entities — Drafts
var draft_1 = require("./messaging/entities/draft");
Object.defineProperty(exports, "Draft", { enumerable: true, get: function () { return draft_1.Draft; } });
// Role
var role_2 = require("./role/entities/role");
Object.defineProperty(exports, "Role", { enumerable: true, get: function () { return role_2.Role; } });
var role_id_1 = require("./role/value-objects/role-id");
Object.defineProperty(exports, "RoleId", { enumerable: true, get: function () { return role_id_1.RoleId; } });
var role_name_1 = require("./role/value-objects/role-name");
Object.defineProperty(exports, "RoleName", { enumerable: true, get: function () { return role_name_1.RoleName; } });
var role_errors_1 = require("./role/errors/role.errors");
Object.defineProperty(exports, "RoleNameAlreadyExistsError", { enumerable: true, get: function () { return role_errors_1.RoleNameAlreadyExistsError; } });
Object.defineProperty(exports, "RoleHasUsersError", { enumerable: true, get: function () { return role_errors_1.RoleHasUsersError; } });
// Messaging Errors
var message_errors_1 = require("./messaging/errors/message.errors");
Object.defineProperty(exports, "MessageNotFoundError", { enumerable: true, get: function () { return message_errors_1.MessageNotFoundError; } });
Object.defineProperty(exports, "UnauthorizedMessageAccessError", { enumerable: true, get: function () { return message_errors_1.UnauthorizedMessageAccessError; } });
var group_errors_1 = require("./messaging/errors/group.errors");
Object.defineProperty(exports, "GroupNotFoundError", { enumerable: true, get: function () { return group_errors_1.GroupNotFoundError; } });
Object.defineProperty(exports, "NotGroupMemberError", { enumerable: true, get: function () { return group_errors_1.NotGroupMemberError; } });
Object.defineProperty(exports, "NotGroupAdminError", { enumerable: true, get: function () { return group_errors_1.NotGroupAdminError; } });
Object.defineProperty(exports, "GroupAlreadyExistsError", { enumerable: true, get: function () { return group_errors_1.GroupAlreadyExistsError; } });
var draft_errors_1 = require("./messaging/errors/draft.errors");
Object.defineProperty(exports, "DraftNotFoundError", { enumerable: true, get: function () { return draft_errors_1.DraftNotFoundError; } });
//# sourceMappingURL=index.js.map