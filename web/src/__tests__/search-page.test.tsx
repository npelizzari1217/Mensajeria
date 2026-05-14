import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchPage from '../pages/search.page';
import * as client from '../api/client';

// ── Mocks ───────────────────────────────────────────────────────────

vi.mock('../api/client', () => ({
  searchMessages: vi.fn(),
  getErrorMessage: vi.fn((err: unknown) =>
    err instanceof Error ? err.message : 'Error desconocido',
  ),
}));

// Helper to render with router context
function renderPage() {
  return render(
    <BrowserRouter>
      <SearchPage />
    </BrowserRouter>,
  );
}

// ── Tests ───────────────────────────────────────────────────────────

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows idle state on initial render', () => {
    renderPage();
    expect(
      screen.getByText(/ingresá un término de búsqueda/i),
    ).toBeInTheDocument();
  });

  it('disables search button when query is too short', () => {
    renderPage();
    const btn = screen.getByRole('button', { name: /buscar/i });
    expect(btn).toBeDisabled();
  });

  it('enables search button when query has 2+ characters', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'te' } });
    const btn = screen.getByRole('button', { name: /buscar/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows loading state while searching', async () => {
    // Make the search never resolve during this test
    vi.mocked(client.searchMessages).mockImplementation(
      () => new Promise(() => {}),
    );

    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/buscando mensajes/i)).toBeInTheDocument();
  });

  it('shows results on successful search', async () => {
    vi.mocked(client.searchMessages).mockResolvedValue({
      data: [
        {
          id: '1',
          senderId: 'u1',
          senderName: 'Alice',
          subject: 'Test Message',
          body: 'Hello',
          sentAt: '2026-05-14T12:00:00Z',
          createdAt: '2026-05-14T12:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results found', async () => {
    vi.mocked(client.searchMessages).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
    });

    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'zzzzz' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/no se encontraron mensajes/i),
      ).toBeInTheDocument();
    });
  });

  it('shows error state on search failure', async () => {
    vi.mocked(client.searchMessages).mockRejectedValue(
      new Error('Network error'),
    );

    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('paginates results', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      senderId: 'u1',
      senderName: `User ${i + 1}`,
      subject: `Message ${i + 1}`,
      body: 'Body',
      sentAt: '2026-05-14T12:00:00Z',
      createdAt: '2026-05-14T12:00:00Z',
    }));

    vi.mocked(client.searchMessages).mockResolvedValue({
      data: items.slice(0, 20),
      total: 25,
      page: 1,
      pageSize: 20,
    });

    renderPage();
    const input = screen.getByPlaceholderText(/mín/i);
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/pagina 1 de 2/i)).toBeInTheDocument();
    });
  });
});
