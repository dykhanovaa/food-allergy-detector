import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/components/LoginPage';

describe('LoginPage', () => {
  it('submits entered credentials', async () => {
    const onLogin = vi.fn().mockResolvedValue(null);
    const onNavigateToRegister = vi.fn();

    render(
      <LoginPage
        onLogin={onLogin}
        onNavigateToRegister={onNavigateToRegister}
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@mail.com' },
    });
    fireEvent.change(document.getElementById('password') as HTMLInputElement, {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('test@mail.com', '123456');
    });
  });

  it('shows backend error and supports navigation to register', async () => {
    const onLogin = vi.fn().mockResolvedValue('Неверный пароль');
    const onNavigateToRegister = vi.fn();

    render(
      <LoginPage
        onLogin={onLogin}
        onNavigateToRegister={onNavigateToRegister}
      />,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@mail.com' },
    });
    fireEvent.change(document.getElementById('password') as HTMLInputElement, {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));
    expect(onNavigateToRegister).toHaveBeenCalledTimes(1);
  });
});
