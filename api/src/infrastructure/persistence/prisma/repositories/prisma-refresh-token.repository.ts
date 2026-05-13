import {
  RefreshTokenRepository,
  RefreshTokenRecord,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';

/**
 * PrismaRefreshTokenRepository — infrastructure adapter implementing
 * RefreshTokenRepository using Prisma.
 *
 * Maps between Prisma's RefreshToken model and the domain's
 * RefreshTokenRecord interface. No mapper needed — the record shape
 * is the same as the database row.
 */
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(record: RefreshTokenRecord): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        token: record.token,
        userId: record.userId,
        expiresAt: record.expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    const row = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!row) return null;
    return {
      token: row.token,
      userId: row.userId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
