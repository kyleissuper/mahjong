import { test, expect, Page } from '@playwright/test';

// --- Helpers ---

async function tapTile(page: Page, tile: string) {
  await page.locator(`.proto-grid button[aria-label="${tile}"]`).click();
}

async function addMeld(page: Page, concealed: boolean) {
  const row = concealed ? 'Concealed' : 'Exposed';
  await page.locator('.proto-row').filter({ hasText: row }).locator('.tile-plus').click();
}

async function enterMeld(page: Page, tiles: string[], concealed: boolean) {
  await addMeld(page, concealed);
  for (const t of tiles) await tapTile(page, t);
}

async function enterFlowers(page: Page, count: number) {
  for (let i = 0; i < count; i++) await tapTile(page, 'F');
}

async function score(page: Page) {
  await page.locator('button').filter({ hasText: 'Score →' }).click();
}

async function pickWin(page: Page, alt: string) {
  await page.locator('.tile-pickable').filter({ has: page.locator(`img[alt="${alt}"]`) }).first().click();
}

async function setContext(page: Page, opts: {
  method?: string; winner: string; dealer: string; from?: string;
  dealerRounds?: number; special?: string[];
}) {
  if (opts.method) {
    await page.locator('.proto-step-row .proto-btn').filter({ hasText: opts.method }).click();
  }
  const step = page.locator('.proto-step');
  await step.locator('.proto-step-row').filter({ hasText: 'Winner' }).locator('.proto-player').filter({ hasText: opts.winner }).click();
  if (opts.from) {
    await step.locator('.proto-step-row').filter({ hasText: 'From' }).locator('.proto-player').filter({ hasText: opts.from }).click();
  }
  await step.locator('.proto-step-row').filter({ hasText: 'Dealer' }).locator('.proto-player').filter({ hasText: opts.dealer }).click();
  if (opts.dealerRounds && opts.dealerRounds > 1) {
    for (let i = 1; i < opts.dealerRounds; i++) {
      await step.locator('.proto-stepper-btn').last().click();
    }
  }
  if (opts.special) {
    for (const s of opts.special) {
      await step.locator('.proto-tag').filter({ hasText: s }).click();
    }
  }
}

async function expectScore(page: Page, pts: number) {
  await expect(page.locator('.proto-breakdown-header')).toContainText(`${pts} pts`);
}

async function expectRules(page: Page, rules: string[]) {
  for (const r of rules) {
    await expect(page.locator('.proto-breakdown')).toContainText(r);
  }
}

async function expectPayment(page: Page, player: string, delta: number) {
  const card = page.locator('.proto-hero-player').filter({ hasText: player });
  const expected = delta > 0 ? `+${delta}` : `${delta}`;
  await expect(card.locator('.proto-hero-delta')).toContainText(expected);
}

// Tile alt text mapping
const ALT: Record<string, string> = {
  '1b': '1 Bamboo', '2b': '2 Bamboo', '3b': '3 Bamboo', '4b': '4 Bamboo', '5b': '5 Bamboo',
  '6b': '6 Bamboo', '7b': '7 Bamboo', '8b': '8 Bamboo', '9b': '9 Bamboo',
  '1d': '1 Dots', '2d': '2 Dots', '3d': '3 Dots', '4d': '4 Dots', '5d': '5 Dots',
  '6d': '6 Dots', '7d': '7 Dots', '8d': '8 Dots', '9d': '9 Dots',
  '1c': '1 Char', '2c': '2 Char', '3c': '3 Char', '4c': '4 Char', '5c': '5 Char',
  '6c': '6 Char', '7c': '7 Char', '8c': '8 Char', '9c': '9 Char',
  'Ew': 'East', 'Sw': 'South', 'Ww': 'West', 'Nw': 'North',
  'Rd': 'Red', 'Gd': 'Green', 'Wd': 'White',
};

// --- Hand definitions ---

interface HandDef {
  name: string;
  exposed?: string[][];
  concealed?: string[][];
  flowers?: number;
  winTile: string;
  context: { method?: string; winner: string; dealer: string; from?: string; dealerRounds?: number; special?: string[] };
  expectedPts: number;
  expectedRules: string[];
  expectedPayments: Record<string, number>;
}

const HANDS: HandDef[] = [
  {
    name: 'Hand 1: dragon pong, discard win (3 pts)',
    exposed: [['Rd', 'Rd', 'Rd']],
    concealed: [['1b', '2b', '3b'], ['4b', '5b', '6b'], ['7d', '8d', '9d'], ['5b', '5b']],
    winTile: '8d',
    context: { winner: 'A', dealer: 'B', from: 'D' },
    expectedPts: 3,
    expectedRules: ['Dragon pong', '2/5/8 pair', 'Only one you can win with'],
    expectedPayments: { A: 3, D: -3 },
  },
  {
    name: 'Hand 2: all chows, self-pick (7 pts)',
    exposed: [['2b', '3b', '4b'], ['2d', '3d', '4d']],
    concealed: [['5b', '6b', '7b'], ['5d', '6d', '7d'], ['8b', '8b']],
    winTile: '8b',
    context: { method: 'self-pick', winner: 'A', dealer: 'B' },
    expectedPts: 7,
    expectedRules: ['All chows', 'Self-pick', 'Only 2 suits'],
    expectedPayments: { A: 22 },
  },
  {
    name: 'Hand 3: wind pong, no terminals with honors (3 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['3b', '3b', '3b'], ['7d', '7d', '7d']],
    concealed: [['4c', '5c', '6c'], ['2b', '2b']],
    winTile: '6c',
    context: { winner: 'A', dealer: 'B', from: 'C' },
    expectedPts: 3,
    expectedRules: ['Wind pong', '2/5/8 pair'],
    expectedPayments: { A: 3, C: -3 },
  },
  {
    name: 'Hand 4: all greens, all pongs (19 pts)',
    exposed: [['5b', '5b', '5b'], ['9b', '9b', '9b'], ['Gd', 'Gd', 'Gd']],
    concealed: [['1b', '1b', '1b'], ['3b', '3b']],
    winTile: '3b',
    context: { method: 'self-pick', winner: 'A', dealer: 'A' },
    expectedPts: 19,
    expectedRules: ['Jade Dragon', 'All pongs'],
    expectedPayments: { A: 60 },
  },
  {
    name: 'Hand 5: clean doorstep, 1-9 chain (5 pts)',
    concealed: [['1d', '2d', '3d'], ['4d', '5d', '6d'], ['7d', '8d', '9d'], ['4b', '4b', '4b'], ['Wd', 'Wd']],
    winTile: '7d',
    context: { winner: 'C', dealer: 'B', from: 'D' },
    expectedPts: 5,
    expectedRules: ['Clean doorstep', '1-9 chain', 'Only one you can win with'],
    expectedPayments: { C: 5, D: -5 },
  },
  {
    name: 'Hand 6: concealed self-pick, three hidden pongs (12 pts)',
    concealed: [['2d', '2d', '2d'], ['6d', '6d', '6d'], ['9b', '9b', '9b'], ['4c', '5c', '6c'], ['5c', '5c']],
    winTile: '5c',
    context: { method: 'self-pick', winner: 'D', dealer: 'C', dealerRounds: 2 },
    expectedPts: 12,
    expectedRules: ['Concealed self-pick', '3 hidden pongs'],
    expectedPayments: { D: 39, C: -15 },
  },
  {
    name: 'Hand 10: pure, four hidden pongs (26 pts)',
    concealed: [['1d', '1d', '1d'], ['3d', '3d', '3d'], ['6d', '6d', '6d'], ['9d', '9d', '9d'], ['4d', '4d']],
    winTile: '4d',
    context: { method: 'self-pick', winner: 'B', dealer: 'A' },
    expectedPts: 26,
    expectedRules: ['Pure', '4 hidden pongs', 'Concealed self-pick'],
    expectedPayments: { B: 79, A: -27 },
  },
  {
    name: 'Hand 13: terminals & honors, all pongs (10 pts)',
    exposed: [['9d', '9d', '9d'], ['9b', '9b', '9b'], ['Ew', 'Ew', 'Ew']],
    concealed: [['1d', '1d', '1d'], ['Wd', 'Wd']],
    winTile: 'Wd',
    context: { winner: 'B', dealer: 'B', from: 'C' },
    expectedPts: 10,
    expectedRules: ['Terminals & honors', 'All pongs', 'Wind pong'],
    expectedPayments: { B: 11, C: -11 },
  },
  {
    name: 'Hand 15: three suit chow, double chow (11 pts)',
    concealed: [['3b', '4b', '5b'], ['3b', '4b', '5b'], ['3d', '4d', '5d'], ['3c', '4c', '5c'], ['8d', '8d']],
    winTile: '5c',
    context: { winner: 'A', dealer: 'D', from: 'D' },
    expectedPts: 11,
    expectedRules: ['3 suit chow', 'Double chow', 'All chows', 'Clean doorstep'],
    expectedPayments: { A: 12, D: -12 },
  },
  {
    name: 'Hand 18: big dragons, semi-pure (16 pts)',
    exposed: [['Gd', 'Gd', 'Gd'], ['Wd', 'Wd', 'Wd']],
    concealed: [['Rd', 'Rd', 'Rd'], ['1b', '2b', '3b'], ['6b', '6b']],
    winTile: '1b',
    context: { winner: 'D', dealer: 'C', from: 'B' },
    expectedPts: 16,
    expectedRules: ['Big dragons', 'Semi-pure'],
    expectedPayments: { D: 16, B: -16 },
  },
  {
    name: 'Hand 21: all pairs (13 pts)',
    concealed: [['2b', '2b'], ['5b', '5b'], ['9b', '9b'], ['3d', '3d'], ['7d', '7d'], ['Ew', 'Ew'], ['Rd', 'Rd']],
    winTile: '7d',
    context: { method: 'self-pick', winner: 'B', dealer: 'D' },
    expectedPts: 13,
    expectedRules: ['All pairs', 'Self-pick'],
    expectedPayments: { B: 40 },
  },
  {
    name: 'Hand 28: big winds (19 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Sw', 'Sw', 'Sw'], ['Ww', 'Ww', 'Ww']],
    concealed: [['Nw', 'Nw', 'Nw'], ['3b', '3b']],
    winTile: '3b',
    context: { winner: 'D', dealer: 'C', from: 'A' },
    expectedPts: 19,
    expectedRules: ['Big winds', 'Only one you can win with'],
    expectedPayments: { D: 19, A: -19 },
  },
  {
    name: 'Hand 7: stolen kong, all from others (5 pts)',
    exposed: [['2c', '3c', '4c'], ['6c', '7c', '8c'], ['Nw', 'Nw', 'Nw'], ['1d', '2d', '3d']],
    concealed: [['8d', '8d']],
    winTile: '8d',
    context: { method: 'stolen-kong', winner: 'B', dealer: 'A', from: 'A' },
    expectedPts: 5,
    expectedRules: ['Wind pong', '2/5/8 pair', 'Only one you can win with', 'Stolen kong', 'All from others'],
    expectedPayments: { B: 6, A: -6 },
  },
  {
    name: 'Hand 8: flower, wind pong, dealer discard (4 pts)',
    flowers: 1,
    exposed: [['1d', '2d', '3d'], ['Ew', 'Ew', 'Ew'], ['3d', '4d', '5d']],
    concealed: [['5b', '6b', '7b'], ['2c', '2c']],
    winTile: '3d',
    context: { winner: 'A', dealer: 'B', from: 'B' },
    expectedPts: 4,
    expectedRules: ['Flower', 'Wind pong', '2/5/8 pair'],
    expectedPayments: { A: 5, B: -5 },
  },
  {
    name: 'Hand 9: win from butt, hidden kong, 2 flowers (7 pts)',
    flowers: 2,
    exposed: [['3d', '3d', '3d'], ['1b', '2b', '3b']],
    concealed: [['8c', '8c', '8c', '8c'], ['4b', '5b', '6b'], ['5d', '5d']],
    winTile: '6b',
    context: { method: 'self-pick', winner: 'C', dealer: 'D', special: ['Replacement draw'] },
    expectedPts: 7,
    expectedRules: ['Flower', '2/5/8 pair', 'Self-pick', 'Win from butt', 'Hidden kong'],
    expectedPayments: { C: 22 },
  },
  {
    name: 'Hand 11: 1-9 chain, split kong, clean doorstep (10 pts)',
    concealed: [['1b', '2b', '3b'], ['4b', '5b', '6b'], ['7b', '8b', '9b'], ['5b', '5b', '5b'], ['8d', '8d']],
    winTile: '9b',
    context: { winner: 'D', dealer: 'C', from: 'A' },
    expectedPts: 10,
    expectedRules: ['2/5/8 pair', 'Only 2 suits', 'Split kong', 'Clean doorstep', '1-9 chain'],
    expectedPayments: { D: 10, A: -10 },
  },
  {
    name: 'Hand 12: three consecutive pongs (11 pts)',
    exposed: [['3b', '3b', '3b'], ['4b', '4b', '4b'], ['5b', '5b', '5b'], ['6d', '7d', '8d']],
    concealed: [['2d', '2d']],
    winTile: '2d',
    context: { winner: 'C', dealer: 'A', from: 'D' },
    expectedPts: 11,
    expectedRules: ['3 consec. pongs', 'All from others'],
    expectedPayments: { C: 11, D: -11 },
  },
  {
    name: 'Hand 14: little dragons (8 pts)',
    exposed: [['Rd', 'Rd', 'Rd'], ['Gd', 'Gd', 'Gd']],
    concealed: [['4b', '5b', '6b'], ['1d', '2d', '3d'], ['Wd', 'Wd']],
    winTile: '6b',
    context: { winner: 'A', dealer: 'C', from: 'B' },
    expectedPts: 8,
    expectedRules: ['Little dragons'],
    expectedPayments: { A: 8, B: -8 },
  },
  {
    name: 'Hand 16: all 1s/9s, three suit pongs (26 pts)',
    exposed: [['9b', '9b', '9b'], ['9d', '9d', '9d'], ['9c', '9c', '9c']],
    concealed: [['1d', '1d', '1d'], ['1c', '1c']],
    winTile: '1c',
    context: { method: 'self-pick', winner: 'B', dealer: 'A', dealerRounds: 5 },
    expectedPts: 26,
    expectedRules: ['All 1s or 9s', '3 suit pongs', 'All pongs'],
    expectedPayments: { B: 87 },
  },
  {
    name: 'Hand 17: four consecutive pongs, semi-pure (14 pts)',
    exposed: [['5d', '5d', '5d'], ['6d', '6d', '6d'], ['7d', '7d', '7d']],
    concealed: [['4d', '4d', '4d'], ['Ww', 'Ww']],
    winTile: 'Ww',
    context: { winner: 'C', dealer: 'B', from: 'A' },
    expectedPts: 14,
    expectedRules: ['4 consec. pongs', 'Semi-pure'],
    expectedPayments: { C: 14, A: -14 },
  },
  {
    name: 'Hand 19: little winds, semi-pure (19 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Sw', 'Sw', 'Sw'], ['Ww', 'Ww', 'Ww']],
    concealed: [['3b', '4b', '5b'], ['Nw', 'Nw']],
    winTile: '4b',
    context: { method: 'self-pick', winner: 'A', dealer: 'A' },
    expectedPts: 19,
    expectedRules: ['Little winds', 'Semi-pure'],
    expectedPayments: { A: 60 },
  },
  {
    name: 'Hand 20: all honors (13 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Nw', 'Nw', 'Nw'], ['Rd', 'Rd', 'Rd']],
    concealed: [['Wd', 'Wd', 'Wd'], ['Sw', 'Sw']],
    winTile: 'Sw',
    context: { winner: 'C', dealer: 'B', from: 'D' },
    expectedPts: 13,
    expectedRules: ['All honors', 'Only one you can win with'],
    expectedPayments: { C: 13, D: -13 },
  },
  {
    name: 'Hand 25: heavenly gates (17 pts)',
    concealed: [['1d', '1d', '1d'], ['2d', '3d', '4d'], ['6d', '7d', '8d'], ['9d', '9d', '9d'], ['5d', '5d']],
    winTile: '5d',
    context: { method: 'self-pick', winner: 'C', dealer: 'D' },
    expectedPts: 17,
    expectedRules: ['Self-pick', 'Heavenly gates'],
    expectedPayments: { C: 52 },
  },
  {
    name: 'Hand with 2 flowers + wind pong (5 pts)',
    flowers: 2,
    exposed: [['Ew', 'Ew', 'Ew'], ['3d', '4d', '5d']],
    concealed: [['5b', '6b', '7b'], ['7c', '8c', '9c'], ['2c', '2c']],
    winTile: '3d',
    context: { winner: 'A', dealer: 'B', from: 'B' },
    expectedPts: 4,
    expectedRules: ['Flower', 'Wind pong', '2/5/8 pair'],
    expectedPayments: { A: 5, B: -5 },
  },
];

// --- Tests ---

test.describe('Prototype scoring', () => {
  for (const hand of HANDS) {
    test(hand.name, async ({ page }) => {
      await page.goto('http://localhost:3000/');

      // Enter flowers
      if (hand.flowers) await enterFlowers(page, hand.flowers);

      // Enter exposed melds
      if (hand.exposed) {
        for (const tiles of hand.exposed) await enterMeld(page, tiles, false);
      }

      // Enter concealed melds
      if (hand.concealed) {
        for (const tiles of hand.concealed) await enterMeld(page, tiles, true);
      }

      // Score
      await score(page);

      // Pick winning tile
      await pickWin(page, ALT[hand.winTile]);

      // Set win context
      await setContext(page, hand.context);

      // Verify
      await expectScore(page, hand.expectedPts);
      await expectRules(page, hand.expectedRules);
      for (const [player, delta] of Object.entries(hand.expectedPayments)) {
        await expectPayment(page, player, delta);
      }
    });
  }
});
