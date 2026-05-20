import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
import { RoleVO } from '../../shared/value-objects/role';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Password } from '../value-objects/password';
import { Result } from '../../shared/result';
export interface CreateUserProps {
    email: Email;
    name: string;
    password: Password;
    role?: RoleVO;
}
export interface UserProps {
    id: UserId;
    email: Email;
    name: string;
    role: RoleVO;
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
 */
export declare class User {
    private readonly id;
    private email;
    private name;
    private role;
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
     * Default role: Usuario.
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
    getRole(): RoleVO;
    getHashedPassword(): string;
    getCreatedAt(): Timestamp;
    getUpdatedAt(): Timestamp;
    /**
     * Checks if the user has sufficient privileges to send messages.
     * All authenticated users can send messages.
     */
    canSendMessage(): boolean;
    /**
     * Checks if the user can assign roles to other users.
     * Only Admin can assign roles.
     */
    canAssignRole(): boolean;
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
     * Only call after verifying the caller has canAssignRole().
     */
    changeRole(newRole: RoleVO): void;
    /**
     * Updates the user's email.
     */
    changeEmail(newEmail: Email): void;
    /**
     * Returns the user's public identity for authorization context.
     */
    getIdentity(): {
        userId: UserId;
        role: RoleVO;
    };
}
//# sourceMappingURL=user.d.ts.map