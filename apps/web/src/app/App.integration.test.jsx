import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  test('renders summary from injected service', async () => {
    const summaryService = {
      getSummary: async () => ({ plants: 3, dueToday: 1 })
    };

    render(<App summaryService={summaryService} />);

    expect(await screen.findByText('Total plants: 3')).toBeInTheDocument();
    expect(await screen.findByText('Due today: 1')).toBeInTheDocument();
  });
});
