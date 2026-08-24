import { test, expect, Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    context: { winner: 'A', dealer: 'A', from: 'D' },
    expectedPts: 3,
    expectedRules: ['Pong of Honor (dragon)', 'Two, Five, Eight Pair', 'Can Only Win with One'],
    expectedPayments: { A: 4, D: -4 },
  },
  {
    name: 'Hand 2: all chows, self-pick (7 pts)',
    exposed: [['2b', '3b', '4b'], ['2d', '3d', '4d']],
    concealed: [['5b', '6b', '7b'], ['5d', '6d', '7d'], ['8b', '8b']],
    winTile: '8b',
    context: { method: 'self-pick', winner: 'A', dealer: 'B' },
    expectedPts: 7,
    expectedRules: ['All Chow Hand', 'Self-Pick', 'Missing a Suit'],
    expectedPayments: { A: 22 },
  },
  {
    name: 'Hand 3: wind pong, no terminals with honors (3 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['3b', '3b', '3b'], ['7d', '7d', '7d']],
    concealed: [['4c', '5c', '6c'], ['2b', '2b']],
    winTile: '6c',
    context: { winner: 'A', dealer: 'A', from: 'C' },
    expectedPts: 3,
    expectedRules: ['Pong of Honor (wind)', 'Two, Five, Eight Pair'],
    expectedPayments: { A: 4, C: -4 },
  },
  {
    name: 'Hand 4: all greens, all pongs (19 pts)',
    exposed: [['5b', '5b', '5b'], ['9b', '9b', '9b'], ['Gd', 'Gd', 'Gd']],
    concealed: [['1b', '1b', '1b'], ['3b', '3b']],
    winTile: '3b',
    context: { method: 'self-pick', winner: 'A', dealer: 'A' },
    expectedPts: 19,
    expectedRules: ['Jade Dragon', 'All Pong Hand'],
    expectedPayments: { A: 60 },
  },
  {
    name: 'Hand 5: clean doorstep, 1-9 chain (5 pts)',
    concealed: [['1d', '2d', '3d'], ['4d', '5d', '6d'], ['7d', '8d', '9d'], ['4b', '4b', '4b'], ['Wd', 'Wd']],
    winTile: '7d',
    context: { winner: 'C', dealer: 'C', from: 'D' },
    expectedPts: 5,
    expectedRules: ['Clean Doorstep', '1 through 9 Train', 'Can Only Win with One'],
    expectedPayments: { C: 6, D: -6 },
  },
  {
    name: 'Hand 6: concealed self-pick, three hidden pongs (12 pts)',
    concealed: [['2d', '2d', '2d'], ['6d', '6d', '6d'], ['9b', '9b', '9b'], ['4c', '5c', '6c'], ['5c', '5c']],
    winTile: '5c',
    context: { method: 'self-pick', winner: 'D', dealer: 'C', dealerRounds: 2 },
    expectedPts: 12,
    expectedRules: ['Clean Doorstep AND Self-Pick', 'Three Hidden Pongs'],
    expectedPayments: { D: 39, C: -15 },
  },
  {
    name: 'Hand 10: pure, four hidden pongs (26 pts)',
    concealed: [['1d', '1d', '1d'], ['3d', '3d', '3d'], ['6d', '6d', '6d'], ['9d', '9d', '9d'], ['4d', '4d']],
    winTile: '4d',
    context: { method: 'self-pick', winner: 'B', dealer: 'A' },
    expectedPts: 26,
    expectedRules: ['Pure Hand', 'Four Hidden Pongs', 'Clean Doorstep AND Self-Pick'],
    expectedPayments: { B: 79, A: -27 },
  },
  {
    name: 'Hand 13: all 1s/9s w/ honors, all pongs (14 pts)',
    exposed: [['9d', '9d', '9d'], ['9b', '9b', '9b'], ['Ew', 'Ew', 'Ew']],
    concealed: [['1d', '1d', '1d'], ['Wd', 'Wd']],
    winTile: 'Wd',
    context: { winner: 'B', dealer: 'B', from: 'C' },
    expectedPts: 14,
    expectedRules: ["Semi 1's or 9's Pongs", 'All Pong Hand', 'Pong of Honor (wind)'],
    expectedPayments: { B: 15, C: -15 },
  },
  {
    name: 'Hand 15: three suit chow, double chow (11 pts)',
    concealed: [['3b', '4b', '5b'], ['3b', '4b', '5b'], ['3d', '4d', '5d'], ['3c', '4c', '5c'], ['8d', '8d']],
    winTile: '5c',
    context: { winner: 'A', dealer: 'D', from: 'D' },
    expectedPts: 11,
    expectedRules: ['Three Suit Chow', 'Double Chow', 'All Chow Hand', 'Clean Doorstep'],
    expectedPayments: { A: 12, D: -12 },
  },
  {
    name: 'Hand 18: big dragons, semi-pure (16 pts)',
    exposed: [['Gd', 'Gd', 'Gd'], ['Wd', 'Wd', 'Wd']],
    concealed: [['Rd', 'Rd', 'Rd'], ['1b', '2b', '3b'], ['6b', '6b']],
    winTile: '1b',
    context: { winner: 'D', dealer: 'D', from: 'B' },
    expectedPts: 16,
    expectedRules: ['Big Dragons', 'Semi-Pure Hand'],
    expectedPayments: { D: 17, B: -17 },
  },
  {
    name: 'Hand 21: all pairs (14 pts)',
    concealed: [['2b', '2b'], ['5b', '5b'], ['9b', '9b'], ['3d', '3d'], ['7d', '7d'], ['Ew', 'Ew'], ['Rd', 'Rd']],
    winTile: '7d',
    context: { method: 'self-pick', winner: 'B', dealer: 'D' },
    expectedPts: 14,
    expectedRules: ['All Pairs', 'Self-Pick'],
    expectedPayments: { B: 43, D: -15 },
  },
  {
    name: 'Hand 28: big winds (19 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Sw', 'Sw', 'Sw'], ['Ww', 'Ww', 'Ww']],
    concealed: [['Nw', 'Nw', 'Nw'], ['3b', '3b']],
    winTile: '3b',
    context: { winner: 'D', dealer: 'D', from: 'A' },
    expectedPts: 19,
    expectedRules: ['Big Winds', 'Can Only Win with One'],
    expectedPayments: { D: 20, A: -20 },
  },
  {
    name: 'Hand 7: stolen kong, all from others (5 pts)',
    exposed: [['2c', '3c', '4c'], ['6c', '7c', '8c'], ['Nw', 'Nw', 'Nw'], ['1d', '2d', '3d']],
    concealed: [['8d', '8d']],
    winTile: '8d',
    context: { method: 'stolen-kong', winner: 'B', dealer: 'A', from: 'A' },
    expectedPts: 5,
    expectedRules: ['Pong of Honor (wind)', 'Two, Five, Eight Pair', 'Can Only Win with One', 'Stolen Kong', 'All from Others'],
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
    expectedRules: ['Flowers', 'Pong of Honor (wind)', 'Two, Five, Eight Pair'],
    expectedPayments: { A: 5, B: -5 },
  },
  {
    name: 'Hand 9: win from butt, hidden kong, 2 flowers (7 pts)',
    flowers: 2,
    exposed: [['3d', '3d', '3d'], ['1b', '2b', '3b']],
    concealed: [['8c', '8c', '8c', '8c'], ['4b', '5b', '6b'], ['5d', '5d']],
    winTile: '6b',
    context: { method: 'self-pick', winner: 'C', dealer: 'D', special: ['Flower Wall draw'] },
    expectedPts: 7,
    expectedRules: ['Flowers', 'Two, Five, Eight Pair', 'Self-Pick', 'Win from the Flower Wall', 'Secret Kong'],
    expectedPayments: { C: 22 },
  },
  {
    name: 'Hand 11: 1-9 chain, split kong, clean doorstep (10 pts)',
    concealed: [['1b', '2b', '3b'], ['4b', '5b', '6b'], ['7b', '8b', '9b'], ['5b', '5b', '5b'], ['8d', '8d']],
    winTile: '9b',
    context: { winner: 'D', dealer: 'D', from: 'A' },
    expectedPts: 10,
    expectedRules: ['Two, Five, Eight Pair', 'Missing a Suit', 'Split Kong', 'Clean Doorstep', '1 through 9 Train'],
    expectedPayments: { D: 11, A: -11 },
  },
  {
    name: 'Hand 12: three consecutive pongs (11 pts)',
    exposed: [['3b', '3b', '3b'], ['4b', '4b', '4b'], ['5b', '5b', '5b'], ['6d', '7d', '8d']],
    concealed: [['2d', '2d']],
    winTile: '2d',
    context: { winner: 'C', dealer: 'C', from: 'D' },
    expectedPts: 11,
    expectedRules: ['Three Consecutive Pongs', 'All from Others'],
    expectedPayments: { C: 12, D: -12 },
  },
  {
    name: 'Hand 14: little dragons (8 pts)',
    exposed: [['Rd', 'Rd', 'Rd'], ['Gd', 'Gd', 'Gd']],
    concealed: [['4b', '5b', '6b'], ['1d', '2d', '3d'], ['Wd', 'Wd']],
    winTile: '6b',
    context: { winner: 'A', dealer: 'A', from: 'B' },
    expectedPts: 8,
    expectedRules: ['Little Dragons'],
    expectedPayments: { A: 9, B: -9 },
  },
  {
    name: 'Hand 16: all 1s/9s, three suit pongs (26 pts)',
    exposed: [['9b', '9b', '9b'], ['9d', '9d', '9d'], ['9c', '9c', '9c']],
    concealed: [['1d', '1d', '1d'], ['1c', '1c']],
    winTile: '1c',
    context: { method: 'self-pick', winner: 'B', dealer: 'A', dealerRounds: 5 },
    expectedPts: 26,
    expectedRules: ["Pure 1's or 9's Pongs", 'Three Suit Pongs', 'All Pong Hand'],
    expectedPayments: { B: 87 },
  },
  {
    name: 'Hand 17: four consecutive pongs, semi-pure (14 pts)',
    exposed: [['5d', '5d', '5d'], ['6d', '6d', '6d'], ['7d', '7d', '7d']],
    concealed: [['4d', '4d', '4d'], ['Ww', 'Ww']],
    winTile: 'Ww',
    context: { winner: 'C', dealer: 'C', from: 'A' },
    expectedPts: 14,
    expectedRules: ['Four Consecutive Pongs', 'Semi-Pure Hand'],
    expectedPayments: { C: 15, A: -15 },
  },
  {
    name: 'Hand 19: little winds, semi-pure (19 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Sw', 'Sw', 'Sw'], ['Ww', 'Ww', 'Ww']],
    concealed: [['3b', '4b', '5b'], ['Nw', 'Nw']],
    winTile: '4b',
    context: { method: 'self-pick', winner: 'A', dealer: 'A' },
    expectedPts: 19,
    expectedRules: ['Little Winds', 'Semi-Pure Hand'],
    expectedPayments: { A: 60 },
  },
  {
    name: 'Hand 20: all honors (13 pts)',
    exposed: [['Ew', 'Ew', 'Ew'], ['Nw', 'Nw', 'Nw'], ['Rd', 'Rd', 'Rd']],
    concealed: [['Wd', 'Wd', 'Wd'], ['Sw', 'Sw']],
    winTile: 'Sw',
    context: { winner: 'C', dealer: 'C', from: 'D' },
    expectedPts: 13,
    expectedRules: ['All Honors', 'Can Only Win with One'],
    expectedPayments: { C: 14, D: -14 },
  },
  {
    name: 'Hand 25: heavenly gates (17 pts)',
    concealed: [['1d', '1d', '1d'], ['2d', '3d', '4d'], ['6d', '7d', '8d'], ['9d', '9d', '9d'], ['5d', '5d']],
    winTile: '5d',
    context: { method: 'self-pick', winner: 'C', dealer: 'D' },
    expectedPts: 17,
    expectedRules: ['Self-Pick', 'Heavenly Gates'],
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
    expectedRules: ['Flowers', 'Pong of Honor (wind)', 'Two, Five, Eight Pair'],
    expectedPayments: { A: 5, B: -5 },
  },
  {
    name: 'Hand 22: thirteen orphans, self-pick (16 pts)',
    concealed: [['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Rd', 'Gd', 'Wd', '1b']],
    winTile: '9c',
    context: { method: 'self-pick', winner: 'A', dealer: 'A' },
    expectedPts: 16,
    expectedRules: ['Thirteen Orphans'],
    expectedPayments: { A: 51 },
  },
  {
    name: 'Hand 22b: thirteen orphans, discard (15 pts)',
    exposed: [['Rd', 'Rd']],
    concealed: [['1b', '9b', '1d', '9d', '1c', '9c', 'Ew', 'Sw', 'Ww', 'Nw', 'Gd', 'Wd']],
    winTile: 'Rd',
    context: { winner: 'A', dealer: 'A', from: 'C' },
    expectedPts: 15,
    expectedRules: ['Thirteen Orphans'],
    expectedPayments: { A: 16, C: -16 },
  },
];

test.describe('Photo scan', () => {
  test('scanned hand populates the hand builder', async ({ page }) => {
    await page.route('**/api/recognize', route =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          melds: [
            { type: 'chow', tiles: ['1c', '2c', '3c'], concealed: false },
            { type: 'chow', tiles: ['7d', '8d', '9d'], concealed: false },
            { type: 'pong', tiles: ['4d', '4d', '4d'], concealed: false },
            { type: 'flower', tiles: ['F'], concealed: false },
            { type: 'pair', tiles: ['9d', '9d'], concealed: true },
            { type: 'chow', tiles: ['6c', '7c', '8c'], concealed: true },
          ],
        }),
      }),
    );

    await page.goto('/?standalone');
    await page.getByText('Scan a photo').click();

    // Headless browser has no camera — wait for the fallback file picker
    await page.getByRole('button', { name: 'Choose a photo' }).waitFor({ timeout: 5000 });

    // Upload a tiny valid JPEG to trigger the scan flow
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, 'fixtures/tiny.jpg'));

    // After scan, the "Scanned" confirmation and tiles should appear
    await expect(page.getByText('Scanned')).toBeVisible({ timeout: 10000 });

    // Verify exposed melds: 1c2c3c, 7d8d9d, 4d4d4d, flower
    const exposedRow = page.locator('.scorer-row').filter({ hasText: 'Exposed' });
    for (const tile of ['1c', '2c', '3c', '7d', '8d', '9d', '4d']) {
      await expect(exposedRow.locator(`img[alt="${ALT[tile]}"]`).first()).toBeVisible();
    }

    // Verify concealed melds: 9d9d, 6c7c8c
    const concealedRow = page.locator('.scorer-row').filter({ hasText: 'Concealed' });
    for (const tile of ['9d', '6c', '7c', '8c']) {
      await expect(concealedRow.locator(`img[alt="${ALT[tile]}"]`).first()).toBeVisible();
    }

    // Score button should be available (hand is ready)
    await expect(page.getByText('Score →')).toBeVisible();
  });
});

test.describe('Scoring', () => {
  for (const hand of HANDS) {
    test(hand.name, async ({ page }) => {
      await page.goto('/?standalone');

      if (hand.flowers) await enterFlowers(page, hand.flowers);

      if (hand.exposed) {
        for (const tiles of hand.exposed) await enterMeld(page, tiles, false);
      }

      if (hand.concealed) {
        for (const tiles of hand.concealed) await enterMeld(page, tiles, true);
      }

      await score(page);
      await pickWin(page, ALT[hand.winTile]);
      await setContext(page, hand.context);

      await expectScore(page, hand.expectedPts);
      await expectRules(page, hand.expectedRules);
      for (const [player, delta] of Object.entries(hand.expectedPayments)) {
        await expectPayment(page, player, delta);
      }
    });
  }

  test('dealer bonus is shown in breakdown when dealer is involved', async ({ page }) => {
    await page.goto('/?standalone');

    await enterMeld(page, ['Rd', 'Rd', 'Rd'], false);
    await enterMeld(page, ['1b', '2b', '3b'], true);
    await enterMeld(page, ['4b', '5b', '6b'], true);
    await enterMeld(page, ['7d', '8d', '9d'], true);
    await enterMeld(page, ['5b', '5b'], true);

    await score(page);
    await pickWin(page, ALT['8d']);

    await setContext(page, { winner: 'A', dealer: 'D', from: 'D' });
    await expectDealerBonus(page, 1);
    await expectPayment(page, 'A', 4);
    await expectPayment(page, 'D', -4);
  });

});

// --- Helpers ---

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

async function tapTile(page: Page, tile: string) {
  await page.locator(`.scorer-grid button[aria-label="${tile}"]`).click();
}

async function addMeld(page: Page, concealed: boolean) {
  const row = concealed ? 'Concealed' : 'Exposed';
  await page.locator('.scorer-row').filter({ hasText: row }).locator('.tile-plus').click();
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
  const step = page.locator('.scorer-step');
  const method = opts.method ?? 'discard';

  if (opts.method) {
    await step.locator('.scorer-step-row .scorer-btn').filter({ hasText: opts.method }).click();
  }

  // Winner combobox
  await pickCombo(step.locator('.scorer-step-row').filter({ hasText: 'Winner' }), opts.winner);

  if (method === 'self-pick') {
    // Select the 3 other players
    const others = ['A', 'B', 'C', 'D'].filter(p => p !== opts.winner);
    const combos = step.locator('.combo');
    for (let i = 0; i < 3; i++) {
      await pickCombo(combos.nth(i + 1), others[i]);
    }
  } else {
    // Discarder combobox
    await pickCombo(step.locator('.scorer-step-row').filter({ hasText: 'Discarder' }), opts.from!);
  }

  // Dealer radio
  await step.locator('.scorer-dealer-option').filter({ hasText: opts.dealer }).click();

  // Dealer round stepper
  if (opts.dealerRounds && opts.dealerRounds > 1) {
    for (let i = 1; i < opts.dealerRounds; i++) {
      await step.locator('.scorer-stepper-btn').last().click();
    }
  }

  // Special conditions
  if (opts.special) {
    for (const s of opts.special) {
      await step.locator('.scorer-tag').filter({ hasText: s }).click();
    }
  }
}

async function expectScore(page: Page, pts: number) {
  await expect(page.locator('.scorer-breakdown-header')).toContainText(`${pts} pts`);
}

async function expectRules(page: Page, rules: string[]) {
  for (const r of rules) {
    await expect(page.locator('.scorer-breakdown')).toContainText(r);
  }
}

async function expectPayment(page: Page, player: string, delta: number) {
  const card = page.locator('.scorer-hero-player').filter({ hasText: player });
  const expected = delta > 0 ? `+${delta}` : `${delta}`;
  await expect(card.locator('.scorer-hero-delta')).toContainText(expected);
}

async function expectDealerBonus(page: Page, bonus: number) {
  const dealer = page.locator('.scorer-breakdown-dealer');
  await expect(dealer).toContainText('Dealer');
  await expect(dealer).toContainText(`+${bonus} per payment`);
}

async function pickCombo(container: import('@playwright/test').Locator, value: string) {
  const input = container.locator('.combo-input');
  await input.click();
  await input.fill(value);
  await container.locator('.combo-option').filter({ hasText: value }).first().click();
}

