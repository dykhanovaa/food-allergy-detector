import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteScan, fetchScans } from '../src/api/scans';

describe('scan api helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchScans serializes filters into query params', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0, page: 1, size: 10, pages: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await fetchScans({ page: 2, search: 'milk', is_safe: false, order: 'asc' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/scans?page=2&search=milk&is_safe=false&order=asc'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('deleteScan throws when backend returns non-200', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    await expect(deleteScan(10)).rejects.toThrow(/удаления/i);
  });
});
