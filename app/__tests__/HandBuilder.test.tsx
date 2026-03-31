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

describe('HandBuilder', () => {
  it('shows empty state when no melds', () => {
    setup();
    expect(screen.getByText(/no sets yet/i)).toBeTruthy();
  });

  it('shows existing melds', () => {
    setup([
      { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
      { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
    ]);
    expect(screen.getAllByAltText('1 Bamboo').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('Red').length).toBeGreaterThan(0);
  });

  it('opens add set sheet when clicking add', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    expect(screen.getByText(/add a set/i)).toBeTruthy();
  });

  it('can add a chow by selecting 3 consecutive tiles', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));

    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));
    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'chow',
        tiles: ['1b', '2b', '3b'],
        concealed: true,
      }),
    ]);
  });

  it('can add a pong by selecting one tile', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Pong'));

    await user.click(screen.getByRole('button', { name: '5b' }));

    expect(screen.getByText(/Selected:/)).toBeTruthy();
    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'pong',
        tiles: ['5b', '5b', '5b'],
      }),
    ]);
  });

  it('can add a pair by selecting one tile', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Pair'));

    await user.click(screen.getByRole('button', { name: 'Rd' }));

    expect(screen.getByText(/Selected:/)).toBeTruthy();
    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'pair',
        tiles: ['Rd', 'Rd'],
      }),
    ]);
  });

  it('disables honor tiles when adding a chow', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));

    expect(screen.getByRole('button', { name: 'Ew' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rd' })).toBeDisabled();
  });

  it('enables honor tiles when adding a pong', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Pong'));

    expect(screen.getByRole('button', { name: 'Ew' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rd' })).not.toBeDisabled();
  });

  it('does not allow more than 3 tiles for a chow', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));

    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));
    await user.click(screen.getByRole('button', { name: '4b' }));

    expect(screen.getByText(/Selected:/)).toBeTruthy();
  });

  it('deselects pong tile on second click', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Pong'));

    await user.click(screen.getByRole('button', { name: '5b' }));
    expect(screen.getByText(/Selected:/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '5b' }));
    expect(screen.queryByText(/Selected:/)).toBeNull();
  });

  it('switches pong tile when clicking a different tile', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Pong'));

    await user.click(screen.getByRole('button', { name: '5b' }));
    await user.click(screen.getByRole('button', { name: '8d' }));

    expect(screen.getByText(/Selected:/)).toBeTruthy();
  });

  it('can remove a meld from the hand', async () => {
    const existing: Meld[] = [
      { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
    ];
    const { user, onChange } = setup(existing);

    await user.click(screen.getByText('x'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('can set winning tile on a chow', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));

    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    await user.click(screen.getByRole('button', { name: '3b' }));

    await user.selectOptions(screen.getByRole('combobox'), '2b');
    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        tiles: ['1b', '2b', '3b'],
        winTile: '2b',
      }),
    ]);
  });

  it('resets tiles when switching meld type', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));

    await user.click(screen.getByRole('button', { name: '1b' }));
    await user.click(screen.getByRole('button', { name: '2b' }));
    expect(screen.getByText(/Selected:/)).toBeTruthy();

    await user.click(screen.getByText('Pong'));
    expect(screen.queryByText(/Selected:/)).toBeNull();
  });

  it('can add flowers', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Flower'));

    expect(screen.getByText(/how many flowers/i)).toBeTruthy();
    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'flower',
        tiles: ['F'],
        concealed: false,
      }),
    ]);
  });

  it('hides tile picker and concealed for flowers', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('Flower'));

    expect(screen.queryByText('Bamboo')).toBeNull();
    expect(screen.queryByText('Concealed')).toBeNull();
  });

  it('can add 13 orphans with pair and winning tile', async () => {
    const { user, onChange } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('13 Orphans'));

    // Pick pair tile (1b) and winning tile (9c) from the tile grids
    const allButtons = screen.getAllByRole('button', { name: '1b' });
    await user.click(allButtons[0]); // pair picker

    const winButtons = screen.getAllByRole('button', { name: '9c' });
    await user.click(winButtons[winButtons.length - 1]); // winning tile picker

    await user.click(screen.getByText('Add to hand'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'orphans',
        concealed: true,
        winTile: '9c',
      }),
    ]);
  });

  it('hides tile picker and concealed for 13 orphans', async () => {
    const { user } = setup();
    await user.click(screen.getByText('+ Add set'));
    await user.click(screen.getByText('13 Orphans'));

    expect(screen.queryByText('Bamboo')).toBeNull();
    expect(screen.queryByText('Concealed')).toBeNull();
  });

  it('can edit an existing meld', async () => {
    const existing: Meld[] = [
      { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
    ];
    const { user, onChange } = setup(existing);

    // Click the meld to edit it
    await user.click(screen.getByText('Pong'));

    expect(screen.getByText(/edit set/i)).toBeTruthy();

    // Switch to a different tile
    await user.click(screen.getByRole('button', { name: '8d' }));
    await user.click(screen.getByText('Save'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'pong',
        tiles: ['8d', '8d', '8d'],
      }),
    ]);
  });
});
