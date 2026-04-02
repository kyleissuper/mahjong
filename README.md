# Mahjong Scorer

A scoring calculator for Hong Kong-style mahjong with house rules. Built for weekly game nights so anyone at the table can score a hand without memorizing the rules.

Live at [mahjong.kyletan.com](https://mahjong.kyletan.com).

## Codebase

**Core** (`src/`) — scoring engine, hand validation, tile helpers. Well tested with unit tests, strict TDD. This is the intentionally designed part.

**UI** (`app/`) — React prototype. Phone-first tile picker, win context form, score breakdown, and scoring reference sheet. Functional but still evolving. E2E characterization tests with Playwright.

## Dev

```
npm install
npm run dev        # vite dev server
npm test           # vitest unit tests
npx playwright test # e2e tests
```
