import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePage } from '../src/components/ProfilePage';

const baseProps = {
  allAllergies: [
    { id: 1, name: 'Молоко' },
    { id: 2, name: 'Орехи' },
  ],
  initialAllergyIds: [1],
  onUpdateAllergies: vi.fn(),
  onNavigateToUpload: vi.fn(),
  onNavigateToAdmin: vi.fn(),
  onNavigateToScans: vi.fn(),
  onLogout: vi.fn(),
};

describe('ProfilePage', () => {
  it('shows admin controls only for admin users', () => {
    const { rerender } = render(
      <ProfilePage
        {...baseProps}
        user={{ id: '1', email: 'user@test.com', name: 'User', allergies: ['Молоко'], role: 'user' }}
      />,
    );

    expect(screen.queryByText(/админка/i)).not.toBeInTheDocument();

    rerender(
      <ProfilePage
        {...baseProps}
        user={{ id: '1', email: 'admin@test.com', name: 'Admin', allergies: ['Молоко'], role: 'admin' }}
      />,
    );

    expect(screen.getByText(/админка/i)).toBeInTheDocument();
  });

  it('saves changed allergies', () => {
    const onUpdateAllergies = vi.fn();

    render(
      <ProfilePage
        {...baseProps}
        onUpdateAllergies={onUpdateAllergies}
        user={{ id: '1', email: 'user@test.com', name: 'User', allergies: ['Молоко'], role: 'user' }}
      />,
    );

    fireEvent.click(screen.getByLabelText(/орехи/i));
    fireEvent.click(screen.getByRole('button', { name: /сохранить изменения/i }));

    expect(onUpdateAllergies).toHaveBeenCalledWith([1, 2]);
  });
});
