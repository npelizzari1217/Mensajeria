import { describe, it, expect, vi } from 'vitest';
import { MessagingGateway } from '../../presentation/messaging/messaging.gateway';

// ── Helpers ───────────────────────────────────────────────────────────────

function createMockSocket(auth?: { token?: string }) {
  return {
    handshake: { auth: auth ?? {} },
    join: vi.fn(),
    disconnect: vi.fn(),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('MessagingGateway', () => {
  describe('handleConnection', () => {
    it('should reject connection when no token is provided', async () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({});

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
      expect(mockAuthPort.verify).not.toHaveBeenCalled();
    });

    it('should reject connection when token is empty string', async () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({ token: '' });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with invalid token', async () => {
      const mockAuthPort = {
        verify: vi.fn().mockImplementation(() => {
          throw new Error('Invalid token');
        }),
        sign: vi.fn(),
      };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({ token: 'invalid-token' });

      await gateway.handleConnection(socket);

      expect(mockAuthPort.verify).toHaveBeenCalledWith('invalid-token');
      expect(socket.disconnect).toHaveBeenCalled();
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('should reject connection with expired token', async () => {
      const mockAuthPort = {
        verify: vi.fn().mockImplementation(() => {
          throw new Error('jwt expired');
        }),
        sign: vi.fn(),
      };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({ token: 'expired-token' });

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should accept connection with valid token and join user room', async () => {
      const mockAuthPort = {
        verify: vi.fn().mockReturnValue({ sub: 'user-123', role: 'user' }),
        sign: vi.fn(),
      };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({ token: 'valid-token' });

      await gateway.handleConnection(socket);

      expect(mockAuthPort.verify).toHaveBeenCalledWith('valid-token');
      expect(socket.join).toHaveBeenCalledWith('user:user-123');
      expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('should pass through any role from the JWT payload', async () => {
      const mockAuthPort = {
        verify: vi.fn().mockReturnValue({ sub: 'admin-42', role: 'admin' }),
        sign: vi.fn(),
      };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket({ token: 'admin-token' });

      await gateway.handleConnection(socket);

      expect(socket.join).toHaveBeenCalledWith('user:admin-42');
    });
  });

  describe('handleDisconnect', () => {
    it('should not throw when a client disconnects', async () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const socket = createMockSocket();

      // Must not throw — Socket.IO handles room cleanup automatically
      expect(() => gateway.handleDisconnect(socket)).not.toThrow();
    });
  });

  describe('emitMessageNew', () => {
    it('should emit message:new event to the correct user room', () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const emit = vi.fn();
      gateway.server = { to: vi.fn().mockReturnValue({ emit }) } as any;

      const payload = { messageId: 'msg-1', senderId: 'user-sender' };
      gateway.emitMessageNew('user-recipient', payload);

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-recipient');
      expect(emit).toHaveBeenCalledWith('message:new', payload);
    });

    it('should deliver the same payload to all recipients', () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);

      const emitFirst = vi.fn();
      const emitSecond = vi.fn();

      const toFirst = vi.fn().mockReturnValue({ emit: emitFirst });
      const toSecond = vi.fn().mockReturnValue({ emit: emitSecond });

      // Mock server.to to return different emit fns on successive calls
      const to = vi
        .fn()
        .mockReturnValueOnce({ emit: emitFirst })
        .mockReturnValueOnce({ emit: emitSecond });
      gateway.server = { to } as any;

      const payload = { messageId: 'msg-1', senderId: 'user-sender' };
      gateway.emitMessageNew('user-a', payload);
      gateway.emitMessageNew('user-b', payload);

      expect(to).toHaveBeenCalledTimes(2);
      expect(to).toHaveBeenNthCalledWith(1, 'user:user-a');
      expect(to).toHaveBeenNthCalledWith(2, 'user:user-b');
      expect(emitFirst).toHaveBeenCalledWith('message:new', payload);
      expect(emitSecond).toHaveBeenCalledWith('message:new', payload);
    });
  });

  describe('emitMessageRead', () => {
    it('should emit message:read event to the correct user room', () => {
      const mockAuthPort = { verify: vi.fn(), sign: vi.fn() };
      const gateway = new MessagingGateway(mockAuthPort as any);
      const emit = vi.fn();
      gateway.server = { to: vi.fn().mockReturnValue({ emit }) } as any;

      const payload = {
        messageId: 'msg-1',
        readAt: '2026-01-01T00:00:00.000Z',
      };
      gateway.emitMessageRead('user-recipient', payload);

      expect(gateway.server.to).toHaveBeenCalledWith('user:user-recipient');
      expect(emit).toHaveBeenCalledWith('message:read', payload);
    });
  });
});
