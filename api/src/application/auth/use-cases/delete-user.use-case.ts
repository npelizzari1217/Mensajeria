import { Inject } from '@nestjs/common';
import {
  UserRepository, UserId, UserNotFoundError,
  Result, ok, err,
} from '@mensajeria/domain';

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string): Promise<Result<void, Error>> {
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const userResult = await this.userRepo.findById(uid);
    if (userResult.isErr()) return err(new UserNotFoundError(userId));

    return await this.userRepo.delete(uid);
  }
}
