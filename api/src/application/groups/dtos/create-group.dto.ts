export class CreateGroupDTO {
  name!: string;
  description?: string;
}

export class UpdateGroupDTO {
  name?: string;
  description?: string;
}

export class AddGroupMemberDTO {
  email!: string;
  role?: string;
}

export class RemoveGroupMemberDTO {
  email!: string;
}

export class ChangeMemberRoleDTO {
  email!: string;
  role!: string;
}

export class GroupResponse {
  id!: string;
  name!: string;
  description!: string | null;
  createdBy!: string;
  isActive!: boolean;
  memberCount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class GroupDetailResponse extends GroupResponse {
  members!: GroupMemberResponse[];
}

export class GroupMemberResponse {
  id!: string;
  userId!: string;
  name!: string;
  role!: string;
  joinedAt!: string;
}
