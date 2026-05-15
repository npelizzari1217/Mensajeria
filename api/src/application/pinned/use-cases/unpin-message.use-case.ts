import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class UnpinMessageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(messageId: string, userId: string): Promise<void> {
    const existing = await (this.prisma as any).userPinnedMessage.findUnique({
      where: { userId_messageId: { userId, messageId } },
    });

    if (!existing) {
      return; // Idempotent — not pinned
    }

    await (this.prisma as any).userPinnedMessage.delete({
      where: { id: existing.id },
    });
  }
}
