import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';
import { PinnedMessageResponse } from '../dtos/pinned.dto';

@Injectable()
export class ListPinnedMessagesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<PinnedMessageResponse[]> {
    const pinned = await (this.prisma as any).userPinnedMessage.findMany({
      where: { userId },
      include: {
        message: {
          include: {
            sender: { select: { name: true } },
          },
        },
      },
      orderBy: { pinnedAt: 'desc' },
    });

    return pinned.map((p: any) => ({
      id: p.id,
      messageId: p.messageId,
      senderId: p.message.senderId,
      senderName: p.message.sender.name,
      subject: p.message.subject,
      body: p.message.body.length > 200
        ? p.message.body.slice(0, 200) + '...'
        : p.message.body,
      pinnedAt: p.pinnedAt.toISOString(),
    }));
  }
}
