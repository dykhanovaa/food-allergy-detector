import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

function renderApp() {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays on landing when session restore fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 401 }));

    renderApp();

    expect(await screen.findByRole('heading', { name: /food allergy detector/i })).toBeInTheDocument();
  });

  it('restores authenticated admin session and shows admin navigation', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: 'admin@test.com',
            name: 'Admin',
            allergies: ['Молоко'],
            role: 'admin',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 1, name: 'Молоко' }]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    renderApp();

    expect(await screen.findByText(/профиль/i)).toBeInTheDocument();
    expect(screen.getByText(/админка/i)).toBeInTheDocument();
  });

  it('drops user to landing when analyze request returns 401', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: 'user@test.com',
            name: 'User',
            allergies: [],
            role: 'user',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 1, name: 'Молоко' }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    renderApp();

    await screen.findByText(/профиль/i);
    fireEvent.click(screen.getByRole('button', { name: /анализ/i }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test') });
    fireEvent.change(fileInput, {
      target: { files: [new File(['content'], 'label.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: /начать анализ/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /food allergy detector/i })).toBeInTheDocument();
    });
  });
});
