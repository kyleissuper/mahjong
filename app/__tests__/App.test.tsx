import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App.tsx';

afterEach(cleanup);

// --- Helpers ---

function tile(name: string) {
  return screen.getByRole('button', { name });
}

function addButton() {
  return screen.queryByRole('button', { name: 'Add set' })
    ?? screen.getByText('+ Add set');
}

function winField(label: string) {
  const labelEl = screen.getByText(label, { selector: '.win-label' });
  return labelEl.closest('.win-row')!;
}

// Tile name mapping for winning tile buttons (use img alt text)
const TILE_ALT: Record<string, string> = {
  '1b': '1 Bamboo', '2b': '2 Bamboo', '3b': '3 Bamboo',
  '4b': '4 Bamboo', '5b': '5 Bamboo', '6b': '6 Bamboo',
  '7b': '7 Bamboo', '8b': '8 Bamboo', '9b': '9 Bamboo',
  '1d': '1 Dots', '2d': '2 Dots', '3d': '3 Dots',
  '4d': '4 Dots', '5d': '5 Dots', '6d': '6 Dots',
  '7d': '7 Dots', '8d': '8 Dots', '9d': '9 Dots',
  '1c': '1 Char', '2c': '2 Char', '3c': '3 Char',
  '4c': '4 Char', '5c': '5 Char', '6c': '6 Char',
  '7c': '7 Char', '8c': '8 Char', '9c': '9 Char',
  'Ew': 'East', 'Sw': 'South', 'Ww': 'West', 'Nw': 'North',
  'Rd': 'Red', 'Gd': 'Green', 'Wd': 'White',
};

async function addChow(
  user: ReturnType<typeof userEvent.setup>,
  tiles: [string, string, string],
  opts: { winTile?: string; exposed?: boolean } = {},
) {
  await user.click(addButton());
  if (opts.exposed) await user.click(screen.getByText('Exposed'));
  for (const t of tiles) await user.click(tile(t));
  if (opts.winTile) await user.click(screen.getByRole('button', { name: TILE_ALT[opts.winTile] }));
  await user.click(screen.getByText('Add'));
}

async function addPong(
  user: ReturnType<typeof userEvent.setup>,
  t: string,
  opts: { exposed?: boolean; winTile?: boolean } = {},
) {
  await user.click(addButton());
  await user.click(screen.getByText('Pong'));
  if (opts.exposed) await user.click(screen.getByText('Exposed'));
  await user.click(tile(t));
  if (opts.winTile) await user.click(screen.getByRole('button', { name: TILE_ALT[t] }));
  await user.click(screen.getByText('Add'));
}

async function addPair(user: ReturnType<typeof userEvent.setup>, t: string) {
  await user.click(addButton());
  await user.click(screen.getByRole('button', { name: 'Pair' }));
  await user.click(tile(t));
  await user.click(screen.getByText('Add'));
}

async function setWin(
  user: ReturnType<typeof userEvent.setup>,
  opts: { method?: string; winner: string; dealer: string; from?: string },
) {
  if (opts.method) await user.click(screen.getByRole('button', { name: opts.method }));
  await user.click(within(winField('Winner')).getByText(opts.winner));
  await user.click(within(winField('Dealer')).getByText(opts.dealer));
  if (opts.from) await user.click(within(winField('From')).getByText(opts.from));
}

function expectScore(value: number) {
  const header = screen.getByText('points').closest('.score-header')!;
  expect(within(header).getByText(String(value))).toBeInTheDocument();
}

function expectRules(rules: string[]) {
  for (const rule of rules) {
    expect(screen.getByText(rule)).toBeInTheDocument();
  }
}

function expectPayments(payments: Record<string, number>) {
  const paymentsRow = screen.getByText('points').closest('.score-section')!;
  for (const [player, delta] of Object.entries(payments)) {
    const item = within(paymentsRow).getByText(player, { selector: '.payment-player' }).closest('.payment-item')!;
    const expected = delta > 0 ? `+${delta}` : String(delta);
    expect(within(item).getByText(expected)).toBeInTheDocument();
  }
}

// --- Tests ---

describe('App', () => {
  describe('empty state', () => {
    it('shows only the hand builder initially', () => {
      render(<App />);
      expect(screen.getByText('+ Add set')).toBeInTheDocument();
      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
      expect(screen.queryByText('points')).not.toBeInTheDocument();
    });
  });

  describe('score section gating', () => {
    it('hides scoring controls when hand has only a pair (2 tiles)', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addPair(user, '5b');

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
      expect(screen.queryByText('Dealer')).not.toBeInTheDocument();
    });

    it('hides scoring controls when hand has only a flower', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(addButton());
      await user.click(screen.getByText('Flower'));
      await user.click(screen.getByText('Add'));

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });

    it('hides scoring controls when hand has two chows (6 tiles)', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });

    it('hides scoring controls with 5 sets but no pair (invalid structure)', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d']);
      await addChow(user, ['1c', '2c', '3c']);
      await addPong(user, 'Rd', { exposed: true });

      expect(screen.queryByText('Winner')).not.toBeInTheDocument();
    });

    it('shows scoring controls once hand is a valid structure', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d']);
      await addPong(user, 'Rd', { exposed: true });
      await addPair(user, '5d');

      expect(screen.getByText('Winner')).toBeInTheDocument();
      expect(screen.getByText('Dealer')).toBeInTheDocument();
    });

    it('shows hint when hand is complete but win details are incomplete', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d']);
      await addPong(user, 'Rd', { exposed: true });
      await addPair(user, '5d');

      expect(screen.getByText(/select winner and dealer/i)).toBeInTheDocument();
    });
  });

  describe('scoring Hand 1 — dragon pong, 2/5/8 pair, single wait (3 pts)', () => {
    it('calculates correct score, rules, and payments', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d'], { winTile: '8d' });
      await addPong(user, 'Rd', { exposed: true });
      await addPair(user, '5b');

      await setWin(user, { winner: 'A', dealer: 'B', from: 'D' });

      expectScore(3);
      expectRules(['Dragon pong', '2/5/8 pair', 'Only one you can win with']);
      expectPayments({ A: 3, B: 0, C: 0, D: -3 });
    });
  });

  describe('scoring all-pairs hand (13 pts)', () => {
    it('recognizes 7 pairs with self-pick', async () => {
      const user = userEvent.setup();
      render(<App />);

      for (const t of ['2b', '5b', '9b', '3d', '7d', 'Ew', 'Rd']) {
        await addPair(user, t);
      }

      await setWin(user, { method: 'self-pick', winner: 'B', dealer: 'D' });

      expectScore(13);
      expectRules(['All pairs (7 pairs)', 'Self-pick']);
    });
  });

  describe('scoring thirteen orphans (16 pts)', () => {
    it('handles orphan meld with pair and winning tile', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(addButton());
      await user.click(screen.getByText('13 Orphans'));
      const pair1b = screen.getAllByRole('button', { name: '1b' });
      await user.click(pair1b[0]);
      const win9c = screen.getAllByRole('button', { name: '9c' });
      await user.click(win9c[win9c.length - 1]);
      await user.click(screen.getByText('Add'));

      await setWin(user, { method: 'self-pick', winner: 'A', dealer: 'A' });

      expectScore(16);
      expectRules(['13 orphans', 'Self-pick', 'Only one you can win with']);
    });
  });

  describe('dealer bonus', () => {
    it('adds dealer bonus when dealer is involved in payment', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d'], { winTile: '8d' });
      await addPong(user, 'Rd', { exposed: true });
      await addPair(user, '5b');

      // Dealer is the discarder
      await setWin(user, { winner: 'A', dealer: 'D', from: 'D' });

      expectScore(3);
      // D is dealer and discarder: pays 3 + 1 dealer bonus = 4
      expectPayments({ A: 4, D: -4 });
    });
  });

  describe('reset', () => {
    it('clears hand when "Score next hand" is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await addChow(user, ['1b', '2b', '3b']);
      await addChow(user, ['4b', '5b', '6b']);
      await addChow(user, ['7d', '8d', '9d']);
      await addPong(user, 'Rd', { exposed: true });
      await addPair(user, '5b');
      await setWin(user, { method: 'self-pick', winner: 'A', dealer: 'B' });

      expect(screen.getByText('points')).toBeInTheDocument();

      await user.click(screen.getByText('Score next hand'));

      expect(screen.getByText('+ Add set')).toBeInTheDocument();
      expect(screen.queryByText('points')).not.toBeInTheDocument();
    });
  });
});
