import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App.tsx';

afterEach(cleanup);

async function openAddSheet(user: ReturnType<typeof userEvent.setup>) {
  const tapBtn = screen.queryByText(/tap to add/i);
  if (tapBtn) { await user.click(tapBtn); return; }
  await user.click(screen.getByRole('button', { name: 'Add set' }));
}

async function addChow(user: ReturnType<typeof userEvent.setup>, tiles: [string, string, string], winTile?: string) {
  await openAddSheet(user);
  for (const tile of tiles) await user.click(screen.getByRole('button', { name: tile }));
  if (winTile) {
    const altNames: Record<string, string> = {
      '7d': '7 Dots', '8d': '8 Dots', '9d': '9 Dots',
    };
    await user.click(screen.getByRole('button', { name: altNames[winTile] ?? winTile }));
  }
  await user.click(screen.getByText('Add'));
}

async function addPong(user: ReturnType<typeof userEvent.setup>, tile: string) {
  await openAddSheet(user);
  await user.click(screen.getByText('Pong'));
  await user.click(screen.getByText('Exposed'));
  await user.click(screen.getByRole('button', { name: tile }));
  await user.click(screen.getByText('Add'));
}

async function addPair(user: ReturnType<typeof userEvent.setup>, tile: string) {
  await openAddSheet(user);
  await user.click(screen.getByRole('button', { name: 'Pair' }));
  await user.click(screen.getByRole('button', { name: tile }));
  await user.click(screen.getByText('Add'));
}

async function setWinContext(user: ReturnType<typeof userEvent.setup>, opts: {
  method?: string;
  winner: string;
  dealer: string;
  from?: string;
}) {
  if (opts.method) await user.click(screen.getByRole('button', { name: opts.method }));
  const winnerRow = screen.getByText('Winner').closest('.win-row')!;
  await user.click(within(winnerRow).getByText(opts.winner));
  const dealerRow = screen.getByText('Dealer').closest('.win-row')!;
  await user.click(within(dealerRow).getByText(opts.dealer));
  if (opts.from) {
    const fromRow = screen.getByText('From').closest('.win-row')!;
    await user.click(within(fromRow).getByText(opts.from));
  }
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
  });

  it('shows hint before win details filled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addChow(user, ['1b', '2b', '3b']);
    await addPair(user, '5b');

    expect(screen.getByText(/select winner and dealer/i)).toBeInTheDocument();
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
  });

  it('scores thirteen orphans', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openAddSheet(user);
    await user.click(screen.getByText('13 Orphans'));
    const all1b = screen.getAllByRole('button', { name: '1b' });
    await user.click(all1b[0]);
    const all9c = screen.getAllByRole('button', { name: '9c' });
    await user.click(all9c[all9c.length - 1]);
    await user.click(screen.getByText('Add'));

    await setWinContext(user, { method: 'self-pick', winner: 'A', dealer: 'A' });

    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('13 orphans')).toBeInTheDocument();
  });
});
