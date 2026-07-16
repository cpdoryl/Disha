import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../page';

const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/store/auth.store', () => ({
  useAuthStore: (selector: (state: { login: typeof loginMock }) => unknown) =>
    selector({ login: loginMock }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockClear();
    loginMock.mockClear();
  });

  it('shows validation errors for empty submission', async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the role dashboard on success', async () => {
    loginMock.mockResolvedValueOnce({ role: 'teacher' });

    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText(/email address/i), 'teacher@disha.local');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('teacher@disha.local', 'password123');
      expect(pushMock).toHaveBeenCalledWith('/dashboard/teacher');
    });
  });
});
