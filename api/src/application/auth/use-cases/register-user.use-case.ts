import {
  Email,
  Password,
  RoleVO,
  User,
  UserRegistered,
  UserRepository,
  EmailAlreadyExistsError,
  Result,
  ok,
  err,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { PasswordHasher } from '../ports/password-hasher';
import { RegisterUserDTO } from '../dtos/register-user.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';

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

    // 2. Check uniqueness
    const exists = await this.userRepo.existsByEmail(email);
    if (exists) {
      return err(new EmailAlreadyExistsError(email.get()));
    }

    // 3. Validate password strength
    const passwordResult = Password.create(dto.password);
    if (passwordResult.isErr()) {
      return err(passwordResult.unwrapErr());
    }
    const plainPassword = passwordResult.unwrap();

    // 4. Validate name
    if (!dto.name || dto.name.trim().length === 0) {
      return err(new Error('Name cannot be empty'));
    }

    // 5. Parse role (optional — defaults to Usuario)
    let role: RoleVO | undefined;
    if (dto.role) {
      const roleResult = RoleVO.create(dto.role);
      if (roleResult.isErr()) {
        return err(roleResult.unwrapErr());
      }
      role = roleResult.unwrap();
    }

    // 6. Create domain entity
    const userResult = User.create({
      email,
      name: dto.name,
      password: plainPassword,
      role,
    });
    if (userResult.isErr()) {
      return err(userResult.unwrapErr());
    }
    const user = userResult.unwrap();

    // 7. Hash password
    const hashedPassword = await this.passwordHasher.hash(plainPassword.get());
    user.setHashedPassword(hashedPassword);

    // 8. Persist
    const saveResult = await this.userRepo.save(user);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 9. Emit event
    const event = new UserRegistered(
      user.getId(),
      user.getEmail(),
      user.getName(),
      user.getRole(),
    );
    this.eventBus.publish(event);

    // 10. Return profile
    return ok({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get(),
      createdAt: user.getCreatedAt().toString(),
    });
  }
}
