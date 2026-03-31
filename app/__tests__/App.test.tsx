import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App.tsx';

afterEach(cleanup);

async function addChow(user: ReturnType<typeof userEvent.setup>, tiles: [string, string, string], winTile?: string) {
  await user.click(screen.getByText('+ Add set'));
  for (const tile of tiles) await user.click(screen.getByRole('button', { name: tile }));
  if (winTile) {
    // Winning tile buttons use img alt as accessible name
    const altNames: Record<string, string> = {
      '1b': '1 Bamboo', '2b': '2 Bamboo', '3b': '3 Bamboo', '4b': '4 Bamboo',
      '5b': '5 Bamboo', '6b': '6 Bamboo', '7b': '7 Bamboo', '8b': '8 Bamboo', '9b': '9 Bamboo',
      '1d': '1 Dots', '2d': '2 Dots', '3d': '3 Dots', '4d': '4 Dots',
      '5d': '5 Dots', '6d': '6 Dots', '7d': '7 Dots', '8d': '8 Dots', '9d': '9 Dots',
      '1c': '1 Char', '2c': '2 Char', '3c': '3 Char', '4c': '4 Char',
      '5c': '5 Char', '6c': '6 Char', '7c': '7 Char', '8c': '8 Char', '9c': '9 Char',
    };
    await user.click(screen.getByRole('button', { name: altNames[winTile] ?? winTile }));
  }
  await user.click(screen.getByText('Add to hand'));
}

async function addPong(user: ReturnType<typeof userEvent.setup>, tile: string, concealed = false) {
  await user.click(screen.getByText('+ Add set'));
  await user.click(screen.getByText('Pong'));
  if (!concealed) await user.click(screen.getByText('Exposed'));
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
  // Player pickers: find by label text then click the right player button within
  const winnerField = screen.getByText('Winner').closest('.win-field')!;
  await user.click(within(winnerField).getByText(opts.winner));
  const dealerField = screen.getByText('Dealer').closest('.win-field')!;
  await user.click(within(dealerField).getByText(opts.dealer));
  if (opts.from) {
    const fromField = screen.getByText('From').closest('.win-field')!;
    await user.click(within(fromField).getByText(opts.from));
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
