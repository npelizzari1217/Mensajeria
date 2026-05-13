import { describe, it, expect } from 'vitest';
import { UserId } from '../shared/value-objects/user-id';
import { MessageId } from '../shared/value-objects/message-id';
import { Email } from '../shared/value-objects/email';
import { RoleVO, Role } from '../shared/value-objects/role';
import { Subject } from '../shared/value-objects/subject';
import { MessageBody } from '../shared/value-objects/message-body';
import { MessageStatusVO, MessageStatus } from '../shared/value-objects/message-status';
import { Timestamp } from '../shared/value-objects/timestamp';
import { Password } from '../auth/value-objects/password';

describe('UserId', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('creates a valid UserId', () => {
    const result = UserId.create(validUUID);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe(validUUID);
  });

  it('rejects empty string', () => {
    const result = UserId.create('');
    expect(result.isErr()).toBe(true);
  });

  it('rejects invalid UUID format', () => {
    const result = UserId.create('not-a-uuid');
    expect(result.isErr()).toBe(true);
  });

  it('rejects whitespace-only', () => {
    const result = UserId.create('   ');
    expect(result.isErr()).toBe(true);
  });

  it('compares equality by value', () => {
    const a = UserId.create(validUUID).unwrap();
    const b = UserId.create(validUUID).unwrap();
    expect(a.equals(b)).toBe(true);
  });

  it('compares inequality for different values', () => {
    const a = UserId.create(validUUID).unwrap();
    const b = UserId.create('550e8400-e29b-41d4-a716-446655440001').unwrap();
    expect(a.equals(b)).toBe(false);
  });

  it('reconstructs without validation', () => {
    const id = UserId.reconstruct(validUUID);
    expect(id.get()).toBe(validUUID);
  });

  it('returns string representation', () => {
    const id = UserId.create(validUUID).unwrap();
    expect(id.toString()).toBe(validUUID);
  });
});

describe('MessageId', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('creates a valid MessageId', () => {
    const result = MessageId.create(validUUID);
    expect(result.isOk()).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = MessageId.create('bad-id');
    expect(result.isErr()).toBe(true);
  });

  it('compares equality', () => {
    const a = MessageId.create(validUUID).unwrap();
    const b = MessageId.create(validUUID).unwrap();
    expect(a.equals(b)).toBe(true);
  });
});

describe('Email', () => {
  it('creates a valid email', () => {
    const result = Email.create('User@Example.com');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe('user@example.com'); // lowercased
  });

  it('rejects invalid email', () => {
    const result = Email.create('not-an-email');
    expect(result.isErr()).toBe(true);
  });

  it('rejects empty email', () => {
    const result = Email.create('');
    expect(result.isErr()).toBe(true);
  });

  it('rejects email over 254 chars', () => {
    const long = 'a'.repeat(250) + '@b.co';
    const result = Email.create(long);
    expect(result.isErr()).toBe(true);
  });

  it('compares case-insensitively', () => {
    const a = Email.create('User@Example.com').unwrap();
    const b = Email.create('user@example.com').unwrap();
    expect(a.equals(b)).toBe(true);
  });

  it('trims whitespace', () => {
    const result = Email.create('  user@example.com  ');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe('user@example.com');
  });
});

describe('RoleVO', () => {
  it('creates a valid role', () => {
    const result = RoleVO.create('Admin');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe(Role.Admin);
  });

  it('accepts lowercase role name', () => {
    const result = RoleVO.create('admin');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe(Role.Admin);
  });

  it('rejects invalid role', () => {
    const result = RoleVO.create('SuperAdmin');
    expect(result.isErr()).toBe(true);
  });

  it('rejects empty role', () => {
    const result = RoleVO.create('');
    expect(result.isErr()).toBe(true);
  });

  it('provides default role', () => {
    const defaultRole = RoleVO.default();
    expect(defaultRole.get()).toBe(Role.Usuario);
  });

  it('checks hierarchy with isAtLeast', () => {
    const admin = RoleVO.create('Admin').unwrap();
    const user = RoleVO.create('Usuario').unwrap();
    const tec = RoleVO.create('Tecnico').unwrap();

    expect(admin.isAtLeast(Role.Usuario)).toBe(true);
    expect(admin.isAtLeast(Role.Admin)).toBe(true);
    expect(user.isAtLeast(Role.Admin)).toBe(false);
    expect(tec.isAtLeast(Role.Usuario)).toBe(true);
    expect(tec.isAtLeast(Role.Supervisor)).toBe(false);
  });

  it('compares equality', () => {
    const a = RoleVO.create('Admin').unwrap();
    const b = RoleVO.create('Admin').unwrap();
    expect(a.equals(b)).toBe(true);
  });
});

describe('Subject', () => {
  it('creates a valid subject', () => {
    const result = Subject.create('Hello World');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe('Hello World');
  });

  it('rejects empty subject', () => {
    const result = Subject.create('');
    expect(result.isErr()).toBe(true);
  });

  it('rejects whitespace-only subject', () => {
    const result = Subject.create('   ');
    expect(result.isErr()).toBe(true);
  });

  it('rejects subject exceeding 200 chars', () => {
    const long = 'x'.repeat(201);
    const result = Subject.create(long);
    expect(result.isErr()).toBe(true);
  });

  it('accepts subject at 200 chars', () => {
    const exact = 'x'.repeat(200);
    const result = Subject.create(exact);
    expect(result.isOk()).toBe(true);
  });

  it('normalizes internal whitespace', () => {
    const result = Subject.create('Hello    World');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe('Hello World');
  });
});

describe('MessageBody', () => {
  it('creates a valid body', () => {
    const result = MessageBody.create('Hello, this is a message');
    expect(result.isOk()).toBe(true);
  });

  it('creates an empty body', () => {
    const result = MessageBody.create('');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe('');
  });

  it('rejects body exceeding 10000 chars', () => {
    const long = 'x'.repeat(10001);
    const result = MessageBody.create(long);
    expect(result.isErr()).toBe(true);
  });

  it('accepts body at 10000 chars', () => {
    const exact = 'x'.repeat(10000);
    const result = MessageBody.create(exact);
    expect(result.isOk()).toBe(true);
  });

  it('rejects null body', () => {
    const result = MessageBody.create(null as unknown as string);
    expect(result.isErr()).toBe(true);
  });
});

describe('MessageStatusVO', () => {
  it('creates a valid status', () => {
    const result = MessageStatusVO.create('Pending');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe(MessageStatus.Pending);
  });

  it('creates a valid status from lowercase', () => {
    const result = MessageStatusVO.create('read');
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get()).toBe(MessageStatus.Read);
  });

  it('rejects invalid status', () => {
    const result = MessageStatusVO.create('Deleted');
    expect(result.isErr()).toBe(true);
  });

  it('provides default pending status', () => {
    const pending = MessageStatusVO.pending();
    expect(pending.get()).toBe(MessageStatus.Pending);
  });

  it('compares equality', () => {
    const a = MessageStatusVO.create('Delivered').unwrap();
    const b = MessageStatusVO.create('Delivered').unwrap();
    expect(a.equals(b)).toBe(true);
  });
});

describe('Timestamp', () => {
  it('creates from a Date', () => {
    const date = new Date('2025-01-15T10:30:00Z');
    const result = Timestamp.create(date);
    expect(result.isOk()).toBe(true);
    expect(result.unwrap().get().toISOString()).toBe(date.toISOString());
  });

  it('creates from an ISO string', () => {
    const result = Timestamp.create('2025-01-15T10:30:00Z');
    expect(result.isOk()).toBe(true);
  });

  it('creates from a timestamp number', () => {
    const result = Timestamp.create(1736937000000);
    expect(result.isOk()).toBe(true);
  });

  it('rejects invalid date', () => {
    const result = Timestamp.create('not-a-date');
    expect(result.isErr()).toBe(true);
  });

  it('creates current timestamp with now()', () => {
    const ts = Timestamp.now();
    expect(ts.get()).toBeInstanceOf(Date);
    expect(isNaN(ts.get().getTime())).toBe(false);
  });

  it('compares equality', () => {
    const date = new Date('2025-01-15T10:30:00Z');
    const a = Timestamp.create(date).unwrap();
    const b = Timestamp.create(new Date(date.toISOString())).unwrap();
    expect(a.equals(b)).toBe(true);
  });

  it('checks isAfter', () => {
    const earlier = Timestamp.create('2025-01-15T10:30:00Z').unwrap();
    const later = Timestamp.create('2025-01-15T11:00:00Z').unwrap();
    expect(later.isAfter(earlier)).toBe(true);
    expect(earlier.isAfter(later)).toBe(false);
  });

  it('checks isBefore', () => {
    const earlier = Timestamp.create('2025-01-15T10:30:00Z').unwrap();
    const later = Timestamp.create('2025-01-15T11:00:00Z').unwrap();
    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isBefore(earlier)).toBe(false);
  });

  it('returns ISO string from toString', () => {
    const ts = Timestamp.create('2025-01-15T10:30:00.000Z').unwrap();
    expect(ts.toString()).toBe('2025-01-15T10:30:00.000Z');
  });
});

describe('Password', () => {
  it('creates a valid password', () => {
    const result = Password.create('SecurePass1');
    expect(result.isOk()).toBe(true);
  });

  it('rejects short password (< 8 chars)', () => {
    const result = Password.create('Ab1');
    expect(result.isErr()).toBe(true);
  });

  it('rejects password without uppercase letter', () => {
    const result = Password.create('securepass1');
    expect(result.isErr()).toBe(true);
  });

  it('rejects password without lowercase letter', () => {
    const result = Password.create('SECUREPASS1');
    expect(result.isErr()).toBe(true);
  });

  it('rejects password without digit', () => {
    const result = Password.create('SecurePass');
    expect(result.isErr()).toBe(true);
  });

  it('rejects empty password', () => {
    const result = Password.create('');
    expect(result.isErr()).toBe(true);
  });

  it('masks toString representation', () => {
    const password = Password.create('SecurePass1').unwrap();
    expect(password.toString()).toBe('********');
    expect(password.get()).toBe('SecurePass1');
  });

  it('creates from hash via fromHash', () => {
    const hash = '$2b$10$hashedvalue123';
    const password = Password.fromHash(hash);
    expect(password.get()).toBe(hash);
  });

  it('compares equality', () => {
    const a = Password.create('SecurePass1').unwrap();
    const b = Password.create('SecurePass1').unwrap();
    expect(a.equals(b)).toBe(true);
  });
});
