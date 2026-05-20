import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/protected-route';

// ── Mocks ───────────────────────────────────────────────────────────

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('../contexts/auth.context', () => ({
  useAuth: mockUseAuth,
}));

// ── Helpers ─────────────────────────────────────────────────────────

function renderRoute(requiredRoles?: string[]) {
  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route element={<ProtectedRoute requiredRoles={requiredRoles} />}>
          <Route
            path="/admin/users"
            element={<div data-testid="admin-page">Admin Content</div>}
          />
        </Route>
        <Route path="/inbox" element={<div data-testid="inbox-page">Inbox</div>} />
        <Route path="/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication only (no requiredRoles)', () => {
    it('shows loading screen while auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute();

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('redirects to /login when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders children when authenticated without requiredRoles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'a@b.com', name: 'Test', role: 'Usuario' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute();

      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });
  });

  describe('with requiredRoles', () => {
    it('renders children when user role is in requiredRoles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'a@b.com', name: 'Admin', role: 'Admin' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin', 'Supervisor']);

      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });

    it('redirects to /inbox when user role is NOT in requiredRoles', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', email: 'b@b.com', name: 'Tecnico', role: 'Tecnico' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin', 'Supervisor']);

      expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
    });

    it('redirects to /inbox when user is null (missing user)', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin']);

      expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
    });

    it('redirects to /inbox when user role is undefined', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '3', email: 'c@b.com', name: 'NoRole', role: '' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin']);

      expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
    });

    it('allows Supervisor to access Manage Users routes', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '4', email: 'd@b.com', name: 'Super', role: 'Supervisor' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin', 'Supervisor']);

      expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    });

    it('redirects Supervisor when only Admin is required', () => {
      mockUseAuth.mockReturnValue({
        user: { id: '4', email: 'd@b.com', name: 'Super', role: 'Supervisor' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        error: null,
      });

      renderRoute(['Admin']);

      expect(screen.getByTestId('inbox-page')).toBeInTheDocument();
    });
  });
});
