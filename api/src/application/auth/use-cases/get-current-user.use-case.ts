import {
  UserId,
  UserRepository,
  UserNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { roleIdToName } from '../role-name-mapper';

/**
 * GetCurrentUserUseCase.
 *
 * Returns the profile of the currently authenticated user.
 */
export class GetCurrentUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(userId: string): Promise<Result<UserProfileDTO, Error>> {
    const idResult = UserId.create(userId);
    if (idResult.isErr()) {
      return err(idResult.unwrapErr());
    }
    const id = idResult.unwrap();

    const userResult = await this.userRepo.findById(id);
    if (userResult.isErr()) {
      return err(new UserNotFoundError(userId));
    }
    const user = userResult.unwrap();

    const roleId = user.getRoleId();
    return ok({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: { id: roleId, name: roleIdToName(roleId) },
      createdAt: user.getCreatedAt().toString(),
    });
  }
}
