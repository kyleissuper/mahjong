import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HandBuilder } from '../HandBuilder.tsx';
import type { Meld } from '../../src/types.js';
import type { ValidationError } from '../../src/validate-hand.js';

afterEach(cleanup);

function renderHand(melds: Meld[] = [], errors: ValidationError[] = []) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(<HandBuilder melds={melds} errors={errors} onChange={onChange} />);
  return { onChange, user };
}

function tile(name: string) {
  return screen.getByRole('button', { name });
}

function addButton() {
  return screen.queryByRole('button', { name: 'Add set' })
    ?? screen.getByText('+ Add set');
}

describe('HandBuilder', () => {
  describe('empty state', () => {
    it('prompts to add first set', () => {
      renderHand();
      expect(screen.getByText('+ Add set')).toBeInTheDocument();
    });

    it('shows add button even when empty', () => {
      renderHand();
      expect(screen.getByRole('button', { name: 'Add set' })).toBeInTheDocument();
    });
  });

  describe('displaying melds', () => {
    it('renders tile images for each meld', () => {
      renderHand([
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'pong', tiles: ['Rd', 'Rd', 'Rd'], concealed: false },
      ]);
      expect(screen.getAllByAltText('1 Bamboo')).toHaveLength(1);
      expect(screen.getAllByAltText('2 Bamboo')).toHaveLength(1);
      expect(screen.getAllByAltText('3 Bamboo')).toHaveLength(1);
      expect(screen.getAllByAltText('Red')).toHaveLength(3);
    });

    it('shows type badges', () => {
      renderHand([
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
      ]);
      expect(screen.getByText('Chow')).toBeInTheDocument();
    });

    it('shows hidden tag for concealed melds', () => {
      renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      expect(screen.getByText('hidden')).toBeInTheDocument();
    });

    it('shows win tag when meld has winTile', () => {
      renderHand([
        { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: true, winTile: '8d' },
      ]);
      expect(screen.getByText('win')).toBeInTheDocument();
    });

    it('does not show hidden tag for exposed melds', () => {
      renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: false },
      ]);
      expect(screen.queryByText('hidden')).not.toBeInTheDocument();
    });

    it('shows validation errors below the meld', () => {
      renderHand(
        [{ type: 'chow', tiles: ['1b', '3b', '5b'], concealed: true }],
        [{ type: 'meld', meld: 0, message: 'chow tiles must be consecutive' }],
      );
      expect(screen.getByText('chow tiles must be consecutive')).toBeInTheDocument();
    });
  });

  describe('adding a chow', () => {
    it('selects 3 tiles individually', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true }),
      ]);
    });

    it('ignores a 4th tile click', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));
      await user.click(tile('4b'));

      // Only 3 tiles selected — winning tile section shows for the original 3
      expect(screen.getByText(/Winning tile/)).toBeInTheDocument();
      // 4b should not be pressed
      expect(tile('4b')).toHaveAttribute('aria-pressed', 'false');
    });

    it('deselects a tile on re-click', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('1b'));

      // 1b deselected, only 2b remains — can't add with just 1 tile
      expect(tile('1b')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('Add')).toBeDisabled();
    });

    it('disables honor tiles', async () => {
      const { user } = renderHand();
      await user.click(addButton());

      expect(tile('Ew')).toBeDisabled();
      expect(tile('Rd')).toBeDisabled();
    });

    it('cannot add with fewer than 3 tiles', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));

      expect(screen.getByText('Add')).toBeDisabled();
    });
  });

  describe('adding a pong', () => {
    it('fills 3 identical tiles from a single click', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Pong'));
      await user.click(tile('5b'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'pong', tiles: ['5b', '5b', '5b'] }),
      ]);
    });

    it('deselects on re-click', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Pong'));
      await user.click(tile('5b'));
      await user.click(tile('5b'));

      expect(screen.queryByText(/Winning tile/)).not.toBeInTheDocument();
      expect(screen.getByText('Add')).toBeDisabled();
    });

    it('switches tile on different click', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Pong'));
      await user.click(tile('5b'));
      await user.click(tile('8d'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ tiles: ['8d', '8d', '8d'] }),
      ]);
    });

    it('enables honor tiles', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Pong'));

      expect(tile('Ew')).toBeEnabled();
      expect(tile('Rd')).toBeEnabled();
    });
  });

  describe('adding a kong', () => {
    it('fills 4 identical tiles from a single click', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Kong'));
      await user.click(tile('9c'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'kong', tiles: ['9c', '9c', '9c', '9c'] }),
      ]);
    });
  });

  describe('adding a pair', () => {
    it('fills 2 identical tiles from a single click', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Pair'));
      await user.click(tile('Rd'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'pair', tiles: ['Rd', 'Rd'] }),
      ]);
    });
  });

  describe('adding flowers', () => {
    it('adds 1 flower by default', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Flower'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'flower', tiles: ['F'], concealed: false }),
      ]);
    });

    it('hides tile picker and concealed toggle', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Flower'));

      expect(screen.queryByText('Bamboo')).not.toBeInTheDocument();
      expect(screen.queryByText('Concealed')).not.toBeInTheDocument();
    });
  });

  describe('adding 13 orphans', () => {
    it('builds orphans with pair and winning tile', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('13 Orphans'));

      // Two tile pickers: pair and winning tile
      const pairButtons = screen.getAllByRole('button', { name: '1b' });
      await user.click(pairButtons[0]);

      const winButtons = screen.getAllByRole('button', { name: '9c' });
      await user.click(winButtons[winButtons.length - 1]);

      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'orphans',
          concealed: true,
          winTile: '9c',
        }),
      ]);
      // Pair tile should be the duplicate
      const call = onChange.mock.calls[0][0][0];
      expect(call.tiles.filter((t: string) => t === '1b')).toHaveLength(2);
    });

    it('hides tile picker and concealed toggle', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('13 Orphans'));

      expect(screen.queryByText('Bamboo')).not.toBeInTheDocument();
      expect(screen.queryByText('Concealed')).not.toBeInTheDocument();
    });
  });

  describe('winning tile', () => {
    it('sets winning tile via tile button', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));

      // The winning tile buttons use img alt names
      await user.click(screen.getByRole('button', { name: '2 Bamboo' }));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ winTile: '2b' }),
      ]);
    });

    it('defaults to no winning tile', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));
      await user.click(screen.getByText('Add'));

      const meld = onChange.mock.calls[0][0][0];
      expect(meld.winTile).toBeUndefined();
    });
  });

  describe('concealed/exposed', () => {
    it('defaults to concealed', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ concealed: true }),
      ]);
    });

    it('can toggle to exposed', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(screen.getByText('Exposed'));
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(tile('3b'));
      await user.click(screen.getByText('Add'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ concealed: false }),
      ]);
    });
  });

  describe('switching type', () => {
    it('resets tiles when switching', async () => {
      const { user } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(tile('2b'));
      await user.click(screen.getByText('Pong'));

      expect(screen.queryByText(/Winning tile/)).not.toBeInTheDocument();
      expect(screen.getByText('Add')).toBeDisabled();
    });
  });

  describe('removing melds', () => {
    it('removes the meld at the clicked index', async () => {
      const { user, onChange } = renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
        { type: 'pair', tiles: ['Rd', 'Rd'], concealed: true },
      ]);
      const removeButtons = screen.getAllByText('×');
      await user.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'pair', tiles: ['Rd', 'Rd'] }),
      ]);
    });
  });

  describe('editing melds', () => {
    it('opens editor when clicking a meld', async () => {
      const { user } = renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      await user.click(screen.getByText('Pong'));

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('pre-selects the meld type', async () => {
      const { user } = renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      await user.click(screen.getByText('Pong'));

      const pongBtn = screen.getAllByText('Pong').find(
        el => el.getAttribute('aria-pressed') === 'true'
      );
      expect(pongBtn).toBeTruthy();
    });

    it('saves changes to the correct index', async () => {
      const { user, onChange } = renderHand([
        { type: 'chow', tiles: ['1b', '2b', '3b'], concealed: true },
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      // Click the Pong badge to edit the second meld
      await user.click(screen.getByText('Pong'));
      await user.click(tile('8d'));
      await user.click(screen.getByText('Save'));

      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({ type: 'chow', tiles: ['1b', '2b', '3b'] }),
        expect.objectContaining({ type: 'pong', tiles: ['8d', '8d', '8d'] }),
      ]);
    });

    it('closes editor on cancel without saving', async () => {
      const { user, onChange } = renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      await user.click(screen.getByText('Pong'));
      await user.click(tile('8d'));
      await user.click(screen.getByText('Cancel'));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
    });

    it('collapses editor via cancel', async () => {
      const { user, onChange } = renderHand([
        { type: 'pong', tiles: ['5b', '5b', '5b'], concealed: true },
      ]);
      await user.click(screen.getByText('Pong'));
      expect(screen.getByText('Save')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Save')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('canceling add', () => {
    it('closes the sheet and does not add', async () => {
      const { user, onChange } = renderHand();
      await user.click(addButton());
      await user.click(tile('1b'));
      await user.click(screen.getByText('Cancel'));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('+ Add set')).toBeInTheDocument();
    });
  });
});
