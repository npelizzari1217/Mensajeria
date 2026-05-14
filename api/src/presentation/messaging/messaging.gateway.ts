import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthPort } from '../../infrastructure/auth/jwt-auth-port';

/**
 * Payload sent to recipients when a new message arrives.
 */
export interface MessageNewPayload {
  messageId: string;
  senderId: string;
}

/**
 * Payload sent to the original sender when a message is read.
 */
export interface MessageReadPayload {
  messageId: string;
  readAt: string;
}

/**
 * MessagingGateway — Socket.IO gateway for real-time messaging events.
 *
 * - Namespace: `/messages`
 * - Auth: JWT token extracted from handshake auth
 * - Rooms: one room per user (`user:{userId}`)
 * - Emits: `message:new` and `message:read` events
 */
@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtAuthPort: JwtAuthPort) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtAuthPort.verify(token);
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {
    // No cleanup needed — Socket.IO handles room cleanup automatically.
  }

  /**
   * Emit `message:new` to a specific recipient's room.
   */
  emitMessageNew(recipientId: string, payload: MessageNewPayload): void {
    this.server.to(`user:${recipientId}`).emit('message:new', payload);
  }

  /**
   * Emit `message:read` to a specific recipient's room.
   */
  emitMessageRead(recipientId: string, payload: MessageReadPayload): void {
    this.server.to(`user:${recipientId}`).emit('message:read', payload);
  }
}
