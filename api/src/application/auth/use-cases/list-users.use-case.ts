import { Inject } from '@nestjs/common';
import {
  UserRepository,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { UserProfileDTO } from '../dtos/user-profile.dto';

export class ListUsersUseCase {
  constructor(@Inject('UserRepository') private readonly userRepo: UserRepository) {}

  async execute(): Promise<Result<UserProfileDTO[], Error>> {
    const result = await this.userRepo.findAll();
    if (result.isErr()) {
      return err(result.unwrapErr());
    }

    const users = result.unwrap().map((user) => ({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get(),
      createdAt: user.getCreatedAt().toString(),
    }));

    return ok(users);
  }
}
