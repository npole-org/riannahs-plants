import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  test('supports plant management + schedule/history workflows after login', async () => {
    let plants = [{ id: 'p1', nickname: 'Monstera' }];

    const summaryService = {
      getSummary: async () => ({ plants: plants.length, dueToday: 0, upcoming: 0, tasks: [] })
    };

    const plantService = {
      listPlants: async () => plants,
      createPlant: async ({ nickname }) => {
        plants = [...plants, { id: 'p2', nickname }];
        return plants[1];
      },
      updatePlant: async (id, { nickname }) => {
        plants = plants.map((p) => (p.id === id ? { ...p, nickname } : p));
        return plants.find((p) => p.id === id);
      },
      deletePlant: async (id) => {
        plants = plants.filter((p) => p.id !== id);
        return { ok: true };
      },
      listEvents: async () => [{ id: 'e1', type: 'water', occurred_on: '2026-02-27' }],
      configureSchedule: async () => ({ plant_id: 'p1', next_water_on: '2026-03-01', next_repot_on: null })
    };

    const authService = {
      me: async () => {
        throw new Error('unauthorized');
      },
      login: async () => ({ ok: true, role: 'admin' }),
      logout: async () => ({ ok: true }),
      createUser: async ({ email, role }) => ({ id: 'u1', email, role })
    };

    render(<App summaryService={summaryService} authService={authService} plantService={plantService} />);

    await screen.findByLabelText('Email');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456789012' } });
    fireEvent.click(screen.getByText('Sign in'));

    expect(await screen.findByText('Monstera')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Admin' }));
    fireEvent.change(screen.getByLabelText('User email'), { target: { value: 'new-user@example.com' } });
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'temporarypass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));
    expect(await screen.findByText('Created user: new-user@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    fireEvent.change(screen.getByLabelText('New plant nickname'), { target: { value: 'Pothos' } });
    fireEvent.click(screen.getByText('Add plant'));
    expect(await screen.findByText('Pothos')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.change(screen.getByDisplayValue('Monstera'), { target: { value: 'Monstera Prime' } });
    fireEvent.click(screen.getByText('Save'));
    expect((await screen.findByLabelText('plant-detail-view')).textContent).toContain('Monstera Prime');

    fireEvent.click(screen.getAllByText('History')[0]);
    expect(await screen.findByText('water · 2026-02-27')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Next water on'), { target: { value: '2026-03-01' } });
    fireEvent.click(screen.getByText('Save schedule'));

    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect((await screen.findByLabelText('dashboard-summary')).textContent).toContain('Total plants: 1');
  });
});
