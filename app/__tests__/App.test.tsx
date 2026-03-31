import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App.tsx';

afterEach(cleanup);

async function addChow(user: ReturnType<typeof userEvent.setup>, tiles: [string, string, string], winTile?: string) {
  await user.click(screen.getByText('+ Add set'));
  for (const tile of tiles) await user.click(screen.getByRole('button', { name: tile }));
  if (winTile) {
    const selects = screen.getAllByRole('combobox');
    const winSelect = selects.find(s => s.previousElementSibling?.textContent?.includes('Winning'));
    if (winSelect) await user.selectOptions(winSelect, winTile);
  }
  await user.click(screen.getByText('Add to hand'));
}

async function addPong(user: ReturnType<typeof userEvent.setup>, tile: string, concealed = false) {
  await user.click(screen.getByText('+ Add set'));
  await user.click(screen.getByText('Pong'));
  if (!concealed) await user.click(screen.getByLabelText('Concealed'));
  await user.click(screen.getByRole('button', { name: tile }));
  await user.click(screen.getByText('Add to hand'));
}

async function addPair(user: ReturnType<typeof userEvent.setup>, tile: string) {
  await user.click(screen.getByText('+ Add set'));
  await user.click(screen.getByRole('button', { name: 'Pair' }));
  await user.click(screen.getByRole('button', { name: tile }));
  await user.click(screen.getByText('Add to hand'));
}

async function setWinContext(user: ReturnType<typeof userEvent.setup>, opts: {
  method?: string;
  winner: string;
  dealer: string;
  from?: string;
}) {
  if (opts.method) await user.click(screen.getByRole('button', { name: opts.method }));
  await user.selectOptions(screen.getByLabelText('Winner:'), opts.winner);
  await user.selectOptions(screen.getByLabelText('Dealer:'), opts.dealer);
  if (opts.from) await user.selectOptions(screen.getByLabelText('From:'), opts.from);
}

describe('App integration', () => {
  it('scores Hand 1 end-to-end', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addChow(user, ['1b', '2b', '3b']);
    await addChow(user, ['4b', '5b', '6b']);
    await addChow(user, ['7d', '8d', '9d'], '8d');
    await addPong(user, 'Rd');
    await addPair(user, '5b');

    await setWinContext(user, { winner: 'A', dealer: 'B', from: 'D' });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('points')).toBeInTheDocument();
    expect(screen.getByText('Dragon pong')).toBeInTheDocument();
    expect(screen.getByText('2/5/8 pair')).toBeInTheDocument();
    expect(screen.getByText('Single tile wait')).toBeInTheDocument();
  });

  it('prompts for win details before showing score', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addChow(user, ['1b', '2b', '3b']);
    await addPair(user, '5b');

    expect(screen.getByText(/fill in the win details/i)).toBeInTheDocument();
  });

  it('shows validation errors inline', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addPong(user, 'Ew');
    expect(screen.getAllByAltText('East').length).toBeGreaterThan(0);
  });

  it('scores all-pairs hand', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const tile of ['2b', '5b', '9b', '3d', '7d', 'Ew', 'Rd']) {
      await addPair(user, tile);
    }

    await setWinContext(user, { method: 'self-pick', winner: 'B', dealer: 'D' });

    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('All pairs')).toBeInTheDocument();
    expect(screen.getByText('Self-pick')).toBeInTheDocument();
  });

  it('scores thirteen orphans', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('13 Orphans'));

    // Pick pair (1b) and winning tile (9c) from orphan tile pickers
    const allButtons1b = screen.getAllByRole('button', { name: '1b' });
    await user.click(allButtons1b[0]);

    const allButtons9c = screen.getAllByRole('button', { name: '9c' });
    await user.click(allButtons9c[allButtons9c.length - 1]);

    await user.click(screen.getByText('Add to hand'));

    await setWinContext(user, { method: 'self-pick', winner: 'A', dealer: 'A' });

    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('Thirteen orphans')).toBeInTheDocument();
  });
});
