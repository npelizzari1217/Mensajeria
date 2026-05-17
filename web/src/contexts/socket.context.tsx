import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth.context';
import { getAccessToken } from '../api/client';

// ── Types ───────────────────────────────────────────────────────────

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// ── Context ─────────────────────────────────────────────────────────

const SocketContext = createContext<SocketContextType | null>(null);

/**
 * SocketProvider — connects to the WS /messages namespace when
 * the user is authenticated and disconnects on logout.
 *
 * MUST be placed INSIDE AuthProvider so it can observe auth state.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out or not yet restored → tear down
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Build socket with auth as a function so it re-reads the
    // access token on every (re)connection attempt — handles
    // token refreshes transparently.
    const apiBase = import.meta.env.VITE_API_URL ?? '';
    const newSocket = io(`${apiBase}/messages`, {
      auth: (cb: (auth: { token: string | null }) => void) => {
        cb({ token: getAccessToken() });
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('WS connection error:', err.message);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket debe usarse dentro de un SocketProvider');
  }
  return ctx;
}
