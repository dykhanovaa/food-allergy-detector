import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegisterPage } from '../src/components/RegisterPage';

describe('RegisterPage', () => {
  it('submits data and navigates to profile on success', async () => {
    const onRegister = vi.fn().mockResolvedValue(null);
    const onNavigateToLogin = vi.fn();
    const onNavigateToProfile = vi.fn();

    render(
      <RegisterPage
        onRegister={onRegister}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToProfile={onNavigateToProfile}
      />,
    );

    fireEvent.change(screen.getByLabelText(/имя/i), { target: { value: 'Alina' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alina@example.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }));

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledWith('alina@example.com', 'password123', 'Alina');
    });
    expect(onNavigateToProfile).toHaveBeenCalledTimes(1);
  });

  it('renders registration error and allows going back to login', async () => {
    const onRegister = vi.fn().mockResolvedValue('Пользователь уже существует');
    const onNavigateToLogin = vi.fn();
    const onNavigateToProfile = vi.fn();

    render(
      <RegisterPage
        onRegister={onRegister}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToProfile={onNavigateToProfile}
      />,
    );

    fireEvent.change(screen.getByLabelText(/имя/i), { target: { value: 'Alina' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alina@example.com' } });
    fireEvent.change(screen.getByLabelText(/пароль/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }));

    expect(await screen.findByText('Пользователь уже существует')).toBeInTheDocument();
    expect(onNavigateToProfile).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /войти/i }));
    expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
  });
});
