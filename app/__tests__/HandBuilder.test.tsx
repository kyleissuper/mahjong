import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HandBuilder } from '../HandBuilder.tsx';
import type { Meld } from '../../src/types.js';

afterEach(cleanup);

function setup(melds: Meld[] = []) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<HandBuilder melds={melds} errors={[]} onChange={onChange} />);
  return { onChange, user };
}

async function openAddSheet(user: ReturnType<typeof userEvent.setup>) {
  const tapBtn = screen.queryByText(/tap to add/i);
  if (tapBtn) { await user.click(tapBtn); return; }
  await user.click(screen.getByRole('button', { name: 'Add set' }));
}

describe('HandBuilder', () => {
  it('shows empty state when no melds', () => {
    setup();
    expect(screen.getByText(/tap to add/i)).toBeTruthy();
  });

  it('shows existing melds', () => {
    setup([
      { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
      { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
    ]);
    expect(screen.getAllByAltText('1 Bamboo').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('Red').length).toBeGreaterThan(0);
  });

  it('opens add set sheet', async () => {
    const { user } = setup();
    await openAddSheet(user);
    expect(screen.getByText('Chow')).toBeTruthy();
  });

  it('can add a chow', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);

    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));
    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'chow', tiles: ['1b', '2b', '3b'] }),
    ]);
  });

  it('can add a pong', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Pong'));
    await user.click(screen.getByRole('button', { name: '5b' }));
    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'pong', tiles: ['5b', '5b', '5b'] }),
    ]);
  });

  it('can add a pair', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Pair'));
    await user.click(screen.getByRole('button', { name: 'Rd' }));
    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'pair', tiles: ['Rd', 'Rd'] }),
    ]);
  });

  it('disables honor tiles for chow', async () => {
    const { user } = setup();
    await openAddSheet(user);
    expect(screen.getByRole('button', { name: 'Ew' })).toBeDisabled();
  });

  it('enables honor tiles for pong', async () => {
    const { user } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Pong'));
    expect(screen.getByRole('button', { name: 'Ew' })).not.toBeDisabled();
  });

  it('caps tiles at 3 for chow', async () => {
    const { user } = setup();
    await openAddSheet(user);
    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));
    await user.click(screen.getByRole('button', { name: '4b' }));
    expect(screen.getByText(/Winning tile/)).toBeTruthy();
  });

  it('deselects pong on re-click', async () => {
    const { user } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Pong'));
    await user.click(screen.getByRole('button', { name: '5b' }));
    expect(screen.getByText(/Winning tile/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '5b' }));
    expect(screen.queryByText(/Winning tile/)).toBeNull();
  });

  it('switches pong tile', async () => {
    const { user } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Pong'));
    await user.click(screen.getByRole('button', { name: '5b' }));
    await user.click(screen.getByRole('button', { name: '8d' }));
    expect(screen.getByText(/Winning tile/)).toBeTruthy();
  });

  it('removes a meld', async () => {
    const { user, onChange } = setup([
      { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
    ]);
    await user.click(screen.getByText('×'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('sets winning tile', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);
    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));
    await user.click(screen.getByRole('button', { name: '2 Bamboo' }));
    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ winTile: '2b' }),
    ]);
  });

  it('resets tiles on type switch', async () => {
    const { user } = setup();
    await openAddSheet(user);
    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByText('Pong'));
    expect(screen.queryByText(/Winning tile/)).toBeNull();
  });

  it('adds flowers', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('Flower'));
    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'flower', tiles: ['F'] }),
    ]);
  });

  it('adds 13 orphans', async () => {
    const { user, onChange } = setup();
    await openAddSheet(user);
    await user.click(screen.getByText('13 Orphans'));

    const all1b = screen.getAllByRole('button', { name: '1b' });
    await user.click(all1b[0]);
    const all9c = screen.getAllByRole('button', { name: '9c' });
    await user.click(all9c[all9c.length - 1]);

    await user.click(screen.getByText('Add'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'orphans', winTile: '9c' }),
    ]);
  });

  it('edits an existing meld', async () => {
    const { user, onChange } = setup([
      { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
    ]);
    await user.click(screen.getByText('Pong'));
    await user.click(screen.getByRole('button', { name: '8d' }));
    await user.click(screen.getByText('Save'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: 'pong', tiles: ['8d', '8d', '8d'] }),
    ]);
  });
});
