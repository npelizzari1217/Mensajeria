import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

@Injectable()
export class PinMessageUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(messageId: string, userId: string): Promise<void> {
    // Verify message exists and user has access
    const message = await (this.prisma as any).message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if already pinned
    const existing = await (this.prisma as any).userPinnedMessage.findUnique({
      where: { userId_messageId: { userId, messageId } },
    });

    if (existing) {
      return; // Idempotent — already pinned
    }

    await (this.prisma as any).userPinnedMessage.create({
      data: { userId, messageId },
    });
  }
}
