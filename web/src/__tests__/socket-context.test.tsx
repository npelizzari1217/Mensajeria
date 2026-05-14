import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocketProvider, useSocket } from '../contexts/socket.context';

// ── Mocks ───────────────────────────────────────────────────────────

const { mockIo } = vi.hoisted(() => ({
  mockIo: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('../contexts/auth.context', () => ({
  useAuth: mockUseAuth,
}));

// Test component that consumes the socket context
function TestConsumer() {
  const { socket, isConnected } = useSocket();
  return (
    <div>
      <span data-testid="has-socket">{socket ? 'yes' : 'no'}</span>
      <span data-testid="is-connected">{isConnected ? 'yes' : 'no'}</span>
    </div>
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe('SocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      error: null,
    });

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>,
    );

    expect(screen.getByTestId('has-socket').textContent).toBe('no');
    expect(screen.getByTestId('is-connected').textContent).toBe('no');
  });

  it('connects when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Test', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      error: null,
    });

    render(
      <SocketProvider>
        <TestConsumer />
      </SocketProvider>,
    );

    expect(mockIo).toHaveBeenCalledWith(
      'http://localhost:3000/messages',
      expect.objectContaining({
        transports: ['websocket', 'polling'],
      }),
    );
  });
});
