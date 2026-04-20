import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanList } from '../src/components/ScanList';

vi.mock('../src/api/scans', () => ({
  fetchScans: vi.fn(),
  deleteScan: vi.fn(),
}));

describe('ScanList', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads scans from query params and deletes selected item', async () => {
    const { fetchScans, deleteScan } = await import('../src/api/scans');
    vi.mocked(fetchScans).mockResolvedValue({
      items: [
        {
          id: 1,
          image_url: null,
          product_name: 'Hazelnut cream',
          ingredients: ['nuts', 'sugar'],
          detected_allergens: ['Орехи'],
          is_safe: false,
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 2,
      size: 10,
      pages: 1,
    });
    vi.mocked(deleteScan).mockResolvedValue(undefined);
    vi.stubGlobal('confirm', vi.fn(() => true));

    render(
      <MemoryRouter initialEntries={['/scans?page=2&search=cream&is_safe=false']}>
        <ScanList onLogout={vi.fn()} onNavigateToProfile={vi.fn()} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchScans).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, search: 'cream', is_safe: false }),
      );
    });

    expect(await screen.findByText('Hazelnut cream')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /удалить/i }));

    await waitFor(() => {
      expect(deleteScan).toHaveBeenCalledWith(1);
    });
  });

  it('shows error when loading scans fails', async () => {
    const { fetchScans } = await import('../src/api/scans');
    vi.mocked(fetchScans).mockRejectedValue(new Error('boom'));

    render(
      <MemoryRouter>
        <ScanList onLogout={vi.fn()} onNavigateToProfile={vi.fn()} />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/не удалось загрузить сканы/i)).toBeInTheDocument();
  });
});
