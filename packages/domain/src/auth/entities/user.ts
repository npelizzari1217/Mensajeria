import { UserId } from '../../shared/value-objects/user-id';
import { Email } from '../../shared/value-objects/email';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Password } from '../value-objects/password';
import { Result, ok, err } from '../../shared/result';

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
export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private name: string,
    private roleId: number,
    private hashedPassword: string,
    private readonly createdAt: Timestamp,
    private updatedAt: Timestamp,
  ) {}

  /**
   * Factory for NEW users (registration).
   * Plaintext password is validated by Password.create().
   * The returned user uses the raw plaintext — the application use case
   * MUST hash it via PasswordHasher before calling user.changePassword().
   *
   * Default roleId: 4 (Usuario).
   */
  static create(props: CreateUserProps): Result<User, Error> {
    if (!props.name || props.name.trim().length === 0) {
      return err(new Error('User name cannot be empty'));
    }
    const roleId = props.roleId ?? 4; // default: Usuario
    return ok(
      new User(
        UserId.reconstruct(crypto.randomUUID()),
        props.email,
        props.name.trim(),
        roleId,
        props.password.get(), // plaintext until hashed by use case
        Timestamp.now(),
        Timestamp.now(),
      ),
    );
  }

  /**
   * Reconstruction from persistence — skips runtime validation.
   * Use ONLY when restoring from a trusted source (DB).
   */
  static reconstruct(props: UserProps): User {
    return new User(
      props.id,
      props.email,
      props.name,
      props.roleId,
      props.hashedPassword,
      props.createdAt,
      props.updatedAt,
    );
  }

  // --- Identity ---

  getId(): UserId {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getName(): string {
    return this.name;
  }

  getRoleId(): number {
    return this.roleId;
  }

  getHashedPassword(): string {
    return this.hashedPassword;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  // --- Behavior ---

  /**
   * Checks if the user has sufficient privileges to send messages.
   * All authenticated users can send messages.
   */
  canSendMessage(): boolean {
    return true;
  }

  /**
   * Checks if the user can assign the given target role to another user.
   *
   * Hierarchy rules:
   *   Admin(1)       → can assign any role (all roleIds)
   *   Supervisor(2)  → can only assign roles with roleId >= 3 (Técnico, Usuario)
   *   Técnico(3)     → cannot assign roles
   *   Usuario(4)     → cannot assign roles
   */
  canAssignRole(targetRoleId: number): boolean {
    if (this.roleId === 1) return true;                 // Admin can assign any role
    if (this.roleId === 2 && targetRoleId >= 3) return true; // Supervisor → Técnico / Usuario
    return false;
  }

  /**
   * Updates the user's hashed password.
   * Called by the use case AFTER hashing via PasswordHasher.
   */
  setHashedPassword(hash: string): void {
    this.hashedPassword = hash;
    this.updatedAt = Timestamp.now();
  }

  /**
   * Updates the user's display name.
   */
  changeName(newName: string): Result<void, Error> {
    if (!newName || newName.trim().length === 0) {
      return err(new Error('Name cannot be empty'));
    }
    this.name = newName.trim();
    this.updatedAt = Timestamp.now();
    return ok(undefined);
  }

  /**
   * Updates the user's role.
   * Only call after verifying the caller has canAssignRole(newRoleId).
   */
  changeRoleId(newRoleId: number): void {
    this.roleId = newRoleId;
    this.updatedAt = Timestamp.now();
  }

  /**
   * Updates the user's email.
   */
  changeEmail(newEmail: Email): void {
    this.email = newEmail;
    this.updatedAt = Timestamp.now();
  }

  /**
   * Returns the user's public identity for authorization context.
   */
  getIdentity(): { userId: UserId; roleId: number } {
    return { userId: this.id, roleId: this.roleId };
  }
}

// Polyfill for environments that may not have crypto.randomUUID
function getRandomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for testing environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
