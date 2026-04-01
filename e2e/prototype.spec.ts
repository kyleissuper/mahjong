import { test, expect, Page } from '@playwright/test';

test.describe('Prototype E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/prototype.html');
  });

  // --- Helpers ---

  async function tapTile(page: Page, tile: string) {
    await page.locator(`.proto-grid button[aria-label="${tile}"]`).click();
  }

  async function addExposedMeld(page: Page) {
    await page.locator('.proto-row').filter({ hasText: 'Exposed' }).locator('.tile-plus').click();
  }

  async function addConcealedMeld(page: Page) {
    await page.locator('.proto-row').filter({ hasText: 'Concealed' }).locator('.tile-plus').click();
  }

  async function selectMeld(page: Page, index: number) {
    await page.locator('.proto-set-tappable').nth(index).click();
  }

  async function clickAction(page: Page, text: string) {
    await page.locator('.proto-sheet-actions button, .proto-actions button, .proto-finish button').filter({ hasText: text }).click();
  }

  async function pickWinTile(page: Page, text: string) {
    await page.locator('.tile-pickable').filter({ has: page.locator(`img[alt="${text}"]`) }).first().click();
  }

  async function setWinner(page: Page, player: string) {
    const row = page.locator('.proto-step-row').filter({ hasText: 'Winner' });
    await row.locator('.proto-player').filter({ hasText: player }).click();
  }

  async function setDealer(page: Page, player: string) {
    const row = page.locator('.proto-step-row').filter({ hasText: 'Dealer' });
    await row.locator('.proto-player').filter({ hasText: player }).click();
  }

  async function setFrom(page: Page, player: string) {
    const row = page.locator('.proto-step-row').filter({ hasText: 'From' });
    await row.locator('.proto-player').filter({ hasText: player }).click();
  }

  async function setMethod(page: Page, method: string) {
    await page.locator('.proto-step-row .proto-btn').filter({ hasText: method }).click();
  }

  // --- Test 1: Hand 1 — Dragon pong, 2/5/8 pair, single wait (3 pts) ---

  test('Hand 1: basic discard win scores 3 pts', async ({ page }) => {
    // Exposed: pong of Red Dragon
    await addExposedMeld(page);
    await tapTile(page, 'Rd');
    await tapTile(page, 'Rd');
    await tapTile(page, 'Rd');

    // Concealed: 3 chows + pair
    await addConcealedMeld(page);
    await tapTile(page, '1b');
    await tapTile(page, '2b');
    await tapTile(page, '3b');

    await addConcealedMeld(page);
    await tapTile(page, '4b');
    await tapTile(page, '5b');
    await tapTile(page, '6b');

    await addConcealedMeld(page);
    await tapTile(page, '7d');
    await tapTile(page, '8d');
    await tapTile(page, '9d');

    await addConcealedMeld(page);
    await tapTile(page, '5b');
    await tapTile(page, '5b');

    // Score
    await clickAction(page, 'Score →');

    // Pick winning tile: 8d (middle wait)
    await pickWinTile(page, '8 Dots');

    // Fill win context
    await setWinner(page, 'A');
    await setFrom(page, 'D');
    await setDealer(page, 'B');

    // Verify score
    await expect(page.locator('.proto-breakdown-header')).toContainText('3 pts');
    await expect(page.locator('.proto-breakdown')).toContainText('Dragon pong');
    await expect(page.locator('.proto-breakdown')).toContainText('2/5/8 pair');
    await expect(page.locator('.proto-breakdown')).toContainText('Only one you can win with');

    // Verify payments
    const heroA = page.locator('.proto-hero-player').filter({ hasText: 'A' });
    await expect(heroA.locator('.proto-hero-delta')).toContainText('+3');
    const heroD = page.locator('.proto-hero-player').filter({ hasText: 'D' });
    await expect(heroD.locator('.proto-hero-delta')).toContainText('-3');
  });

  // --- Test 2: All pairs (13 pts) ---

  test('Hand 21: all pairs scores 13 pts with self-pick', async ({ page }) => {
    // 7 concealed pairs
    for (const tile of ['2b', '5b', '9b', '3d', '7d', 'Ew', 'Rd']) {
      await addConcealedMeld(page);
      await tapTile(page, tile);
      await tapTile(page, tile);
    }

    await clickAction(page, 'Score →');

    // Pick any winning tile
    await pickWinTile(page, '7 Dots');

    // Self-pick
    await setMethod(page, 'self-pick');
    await setWinner(page, 'B');
    await setDealer(page, 'D');

    await expect(page.locator('.proto-breakdown-header')).toContainText('13 pts');
    await expect(page.locator('.proto-breakdown')).toContainText('All pairs');
    await expect(page.locator('.proto-breakdown')).toContainText('Self-pick');
  });

  // --- Test 3: Big hand with dealer bonus ---

  test('Hand 10: pure, four hidden pongs, self-pick (27 pts)', async ({ page }) => {
    // 4 concealed pongs of dots + pair
    await addConcealedMeld(page);
    await tapTile(page, '1d');
    await tapTile(page, '1d');
    await tapTile(page, '1d');

    await addConcealedMeld(page);
    await tapTile(page, '3d');
    await tapTile(page, '3d');
    await tapTile(page, '3d');

    await addConcealedMeld(page);
    await tapTile(page, '6d');
    await tapTile(page, '6d');
    await tapTile(page, '6d');

    await addConcealedMeld(page);
    await tapTile(page, '9d');
    await tapTile(page, '9d');
    await tapTile(page, '9d');

    // Pair
    await addConcealedMeld(page);
    await tapTile(page, '4d');
    await tapTile(page, '4d');

    await clickAction(page, 'Score →');

    // Win tile: 4d (pair wait)
    await pickWinTile(page, '4 Dots');

    await setMethod(page, 'self-pick');
    await setWinner(page, 'B');
    await setDealer(page, 'A');

    await expect(page.locator('.proto-breakdown-header')).toContainText('27 pts');
    await expect(page.locator('.proto-breakdown')).toContainText('Pure');
    await expect(page.locator('.proto-breakdown')).toContainText('4 hidden pongs');

    // Dealer bonus: A pays 27+1=28
    const heroA = page.locator('.proto-hero-player').filter({ hasText: 'A' });
    await expect(heroA.locator('.proto-hero-delta')).toContainText('-28');
  });

  // --- Test 4: Mixed exposed/concealed with flowers ---

  test('Hand with flowers, exposed and concealed melds', async ({ page }) => {
    // Add 2 flowers
    await tapTile(page, 'F');
    await tapTile(page, 'F');

    // Exposed: pong of East Wind
    await addExposedMeld(page);
    await tapTile(page, 'Ew');
    await tapTile(page, 'Ew');
    await tapTile(page, 'Ew');

    // Exposed: chow 3-4-5 dots
    await addExposedMeld(page);
    await tapTile(page, '3d');
    await tapTile(page, '4d');
    await tapTile(page, '5d');

    // Concealed: chow 1-2-3 bamboo
    await addConcealedMeld(page);
    await tapTile(page, '1b');
    await tapTile(page, '2b');
    await tapTile(page, '3b');

    // Concealed: chow 7-8-9 characters
    await addConcealedMeld(page);
    await tapTile(page, '7c');
    await tapTile(page, '8c');
    await tapTile(page, '9c');

    // Concealed: pair 2b
    await addConcealedMeld(page);
    await tapTile(page, '2c');
    await tapTile(page, '2c');

    await clickAction(page, 'Score →');

    // Win tile
    await pickWinTile(page, '3 Dots');

    await setWinner(page, 'A');
    await setFrom(page, 'B');
    await setDealer(page, 'B');

    // Should score — flower + wind pong + 2/5/8 pair at minimum
    await expect(page.locator('.proto-breakdown-header')).toContainText('pts');
    await expect(page.locator('.proto-breakdown')).toContainText('Flower');
    await expect(page.locator('.proto-breakdown')).toContainText('Wind pong');
    await expect(page.locator('.proto-hero')).toBeVisible();
  });
});
