import {
  Email,
  EmpresaId,
  Password,
  User,
  UserRegistered,
  UserRepository,
  EmailAlreadyExistsError,
  ForbiddenDomainError,
  Result,
  ok,
  err,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { PasswordHasher } from '../ports/password-hasher';
import { RegisterUserDTO } from '../dtos/register-user.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { roleIdToName } from '../role-name-mapper';

/**
 * RegisterUserUseCase.
 *
 * Validates input, creates a User entity, hashes the password,
 * persists the user, and emits a UserRegistered event.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(dto: RegisterUserDTO): Promise<Result<UserProfileDTO, Error>> {
    // 1. Validate email
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      return err(emailResult.unwrapErr());
    }
    const email = emailResult.unwrap();

    // 2. Enforce caller permissions (using numeric roleId)
    if (dto.caller) {
      if (dto.caller.callerRoleId === 2) {
        // Supervisor (2) can only create users in their own empresa
        if (dto.empresaId !== dto.caller.callerEmpresaId) {
          return err(new ForbiddenDomainError('Supervisor can only create users in their own empresa'));
        }
        // Supervisor cannot assign Admin role (1)
        if (dto.roleId === 1) {
          return err(new ForbiddenDomainError('Supervisor cannot assign Admin role'));
        }
      } else if (dto.caller.callerRoleId !== 1) {
        return err(new ForbiddenDomainError('Only Admin or Supervisor can register users'));
      }
    }

    // 3. Check uniqueness
    const exists = await this.userRepo.existsByEmail(email);
    if (exists) {
      return err(new EmailAlreadyExistsError(email.get()));
    }

    // 4. Validate password strength
    const passwordResult = Password.create(dto.password);
    if (passwordResult.isErr()) {
      return err(passwordResult.unwrapErr());
    }
    const plainPassword = passwordResult.unwrap();

    // 5. Validate name
    if (!dto.name || dto.name.trim().length === 0) {
      return err(new Error('Name cannot be empty'));
    }

    // 6. Resolve roleId (optional — defaults to 4 = Usuario)
    const roleId = dto.roleId ?? 4;
    if (roleId < 1 || roleId > 4 || !Number.isInteger(roleId)) {
      return err(new Error('Invalid roleId: must be 1-4'));
    }
    const roleName = roleIdToName(roleId);

    // 7. Create domain entity
    const userResult = User.create({
      email,
      name: dto.name,
      password: plainPassword,
      roleId,
    });
    if (userResult.isErr()) {
      return err(userResult.unwrapErr());
    }
    const user = userResult.unwrap();

    // 8. Hash password
    const hashedPassword = await this.passwordHasher.hash(plainPassword.get());
    user.setHashedPassword(hashedPassword);

    // 9. Persist
    const saveResult = await this.userRepo.save(user);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 10. Add to empresa
    const empresaId = EmpresaId.reconstruct(dto.empresaId);
    const membershipResult = await this.userRepo.addToEmpresa(
      user.getId(),
      empresaId,
      user.getRoleId(),
    );
    if (membershipResult.isErr()) {
      return err(membershipResult.unwrapErr());
    }

    // 11. Emit event
    const event = new UserRegistered(
      user.getId(),
      user.getEmail(),
      user.getName(),
      user.getRoleId(),
      roleName,
    );
    this.eventBus.publish(event);

    // 12. Return profile
    return ok({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: { id: user.getRoleId(), name: roleName },
      createdAt: user.getCreatedAt().toString(),
    });
  }
}
