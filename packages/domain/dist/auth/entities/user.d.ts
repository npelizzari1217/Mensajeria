import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Password } from '../value-objects/password';
import { Result } from '../../shared/result';
export interface CreateUserProps {
    email: Email;
    name: string;
    password: Password;
    roleId?: number;
}
export interface UserProps {
    id: UserId;
    email: Email;
    name: string;
    roleId: number;
    hashedPassword: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
/**
 * User entity — aggregate root for the Auth bounded context.
 *
 * Encapsulates identity, credentials, and role-based authorization.
 * Behavior methods enforce domain invariants:
 * - Password validation on creation (delegated to Password VO)
 * - Role assignment permissions
 * - Message sending capability
 *
 * Role hierarchy (numeric roleId): 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario.
 * Lower ID = higher rank.
 */
export declare class User {
    private readonly id;
    private email;
    private name;
    private roleId;
    private hashedPassword;
    private readonly createdAt;
    private updatedAt;
    private constructor();
    /**
     * Factory for NEW users (registration).
     * Plaintext password is validated by Password.create().
     * The returned user uses the raw plaintext — the application use case
     * MUST hash it via PasswordHasher before calling user.changePassword().
     *
     * Default roleId: 4 (Usuario).
     */
    static create(props: CreateUserProps): Result<User, Error>;
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props: UserProps): User;
    getId(): UserId;
    getEmail(): Email;
    getName(): string;
    getRoleId(): number;
    getHashedPassword(): string;
    getCreatedAt(): Timestamp;
    getUpdatedAt(): Timestamp;
    /**
     * Checks if the user has sufficient privileges to send messages.
     * All authenticated users can send messages.
     */
    canSendMessage(): boolean;
    /**
     * Checks if the user can assign the given target role to another user.
     *
     * Hierarchy rules:
     *   Admin(1)       → can assign any role (all roleIds)
     *   Supervisor(2)  → can only assign roles with roleId >= 3 (Técnico, Usuario)
     *   Técnico(3)     → cannot assign roles
     *   Usuario(4)     → cannot assign roles
     */
    canAssignRole(targetRoleId: number): boolean;
    /**
     * Updates the user's hashed password.
     * Called by the use case AFTER hashing via PasswordHasher.
     */
    setHashedPassword(hash: string): void;
    /**
     * Updates the user's display name.
     */
    changeName(newName: string): Result<void, Error>;
    /**
     * Updates the user's role.
     * Only call after verifying the caller has canAssignRole(newRoleId).
     */
    changeRoleId(newRoleId: number): void;
    /**
     * Updates the user's email.
     */
    changeEmail(newEmail: Email): void;
    /**
     * Returns the user's public identity for authorization context.
     */
    getIdentity(): {
        userId: UserId;
        roleId: number;
    };
}
//# sourceMappingURL=user.d.ts.map