import { Result } from '../../shared/result';
import { UserId } from '../../shared/value-objects/user-id';
import { Group } from '../entities/group';

/**
 * GroupRepository port.
 *
 * Defined in domain — implementation in infrastructure.
 */
export interface GroupRepository {
  save(group: Group): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Group | null, Error>>;
  findByUser(userId: UserId): Promise<Result<Group[], Error>>;
  findAll(): Promise<Result<Group[], Error>>;
  update(group: Group): Promise<Result<void, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}
