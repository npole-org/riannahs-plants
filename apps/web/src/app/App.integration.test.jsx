import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  test('renders dashboard due/upcoming data after successful login', async () => {
    const summaryService = {
      getSummary: async () => ({
        plants: 3,
        dueToday: 1,
        upcoming: 1,
        tasks: [
          { plant_id: 'p1', nickname: 'Monstera', type: 'water', due_on: '2026-02-27' },
          { plant_id: 'p2', nickname: 'Pothos', type: 'repot', due_on: '2026-03-01' }
        ]
      })
    };
    const authService = {
      login: async () => ({ ok: true, role: 'admin' }),
      logout: async () => ({ ok: true })
    };

    render(<App summaryService={summaryService} authService={authService} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456789012' } });
    fireEvent.click(screen.getByText('Sign in'));

    expect(await screen.findByText('Signed in as admin.')).toBeInTheDocument();
    expect(await screen.findByText('Total plants: 3')).toBeInTheDocument();
    expect(await screen.findByText('Due today: 1')).toBeInTheDocument();
    expect(await screen.findByText('Upcoming: 1')).toBeInTheDocument();
    expect(await screen.findByText('Monstera · water · 2026-02-27')).toBeInTheDocument();
  });

  test('shows error when login fails', async () => {
    const summaryService = {
      getSummary: async () => ({ plants: 0, dueToday: 0, upcoming: 0, tasks: [] })
    };
    const authService = {
      login: async () => {
        throw new Error('invalid_credentials');
      },
      logout: async () => ({ ok: true })
    };

    render(<App summaryService={summaryService} authService={authService} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongwrongwrong' } });
    fireEvent.click(screen.getByText('Sign in'));

    expect(await screen.findByRole('alert')).toHaveTextContent('invalid_credentials');
  });
});
