import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BarcodeLookupPage } from '../src/components/BarcodeLookupPage';

describe('BarcodeLookupPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows found product details', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          name: 'Coca-Cola',
          brands: 'Coca-Cola',
          categories: 'Beverages',
          nutriments: { energy_100g: 42 },
          image_url: 'https://example.com/coke.png',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(
      <HelmetProvider>
        <BarcodeLookupPage onNavigateToLanding={vi.fn()} />
      </HelmetProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'barcode.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: /найти продукт/i }));

    expect(await screen.findByRole('heading', { name: 'Coca-Cola' })).toBeInTheDocument();
    expect(screen.getByText(/бренд:/i)).toBeInTheDocument();
  });

  it('renders server error response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Продукт не найден' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <HelmetProvider>
        <BarcodeLookupPage onNavigateToLanding={vi.fn()} />
      </HelmetProvider>,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['content'], 'barcode.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: /найти продукт/i }));

    expect(await screen.findByText('Продукт не найден')).toBeInTheDocument();
  });
});
