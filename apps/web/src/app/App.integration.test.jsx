import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  test('supports add/edit/delete plant management after login', async () => {
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
      }
    };

    const authService = {
      login: async () => ({ ok: true, role: 'admin' }),
      logout: async () => ({ ok: true })
    };

    render(<App summaryService={summaryService} authService={authService} plantService={plantService} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123456789012' } });
    fireEvent.click(screen.getByText('Sign in'));

    expect(await screen.findByText('Monstera')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('New plant nickname'), { target: { value: 'Pothos' } });
    fireEvent.click(screen.getByText('Add plant'));
    expect(await screen.findByText('Pothos')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Edit')[0]);
    fireEvent.change(screen.getByDisplayValue('Monstera'), { target: { value: 'Monstera Prime' } });
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Monstera Prime')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Delete')[0]);
    expect(await screen.findByText('Total plants: 1')).toBeInTheDocument();
  });
});
