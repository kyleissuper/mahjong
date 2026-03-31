# Mahjong Scoring Examples

Validated examples of scored hands built through iterative review.

---

## How Payment Works

**Win from discard:** Only the discarder pays the winner. Other players are unaffected.

**Win from self-pick:** All 3 losers pay the winner.

**Dealer bonus:** Whenever the dealer is involved in a payment (as payer OR receiver), add the dealer bonus to that transaction. Formula: `1 + (# extra round × 2)`. First round as dealer = +1. Applies **per transaction**, not once.

### Payment Examples (hand worth N points, dealer in round 1 = +1 bonus)

**Discard win:**
| Scenario | Discarder pays | Winner gets | Others |
|----------|---------------|-------------|--------|
| Neither is dealer | N | +N | 0, 0 |
| Winner is dealer | N+1 | +(N+1) | 0, 0 |
| Discarder is dealer | N+1 | +(N+1) | 0, 0 |

**Self-pick win:**
| Scenario | Each loser pays | Winner gets |
|----------|----------------|-------------|
| Winner is NOT dealer | N each (dealer pays N+1) | +(3N+1) |
| Winner IS dealer | N+1 each | +(3N+3) |

---

## Hand 1 — Basic hand, discard win, single-tile wait

**Tiles:**
- Chow: 1-2-3 bamboo
- Chow: 4-5-6 bamboo
- Chow: 7-9 dots, waiting on 8 dots (won from discard)
- Pong: Red Dragon
- Pair: 5 bamboo

**Hand value: 3 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Red Dragon pong | +1 | Pong of any dragon = 1 pt |
| 2, 5, 8 as pair | +1 | Pair is 5 bamboo |
| Can only win with one | +1 | Waiting on 8 dots only (7-9 wait). Had it been 7-8 waiting on 9, would NOT qualify since 6 also completes it |
| ALL chows | 0 | Has a pong (Red Dragon), so not all chows |
| Self-pick | 0 | Won from discard |
| **Total** | **3** | |

**Point flow (assuming dealer not involved, first round):**
- Discarder → Winner: 3
- Score changes: Winner +3, Discarder -3

**Point flow (if discarder IS dealer, first round):**
- Dealer → Winner: 3+1 = 4
- Score changes: Winner +4, Dealer -4

**Key learnings:**
- "Can only win with one" = the winning tile is the ONLY tile that completes the hand. A 7-8 wait does NOT qualify (both 6 and 9 work). A 7-9 wait DOES qualify (only 8 works).
- Winning from someone's discard: ONLY the discarder pays. Not all losers.
- "ALL chows" requires literally every set to be a chow. One pong disqualifies it.

---

## Hand 2 — All chows, self-pick, pair wait

**Tiles:**
- Chow: 2-3-4 bamboo
- Chow: 5-6-7 bamboo
- Chow: 2-3-4 dots
- Chow: 5-6-7 dots
- Pair: 8 bamboo
- Won by self-pick (drew 8 bamboo from the wall to complete the pair)

**Hand value: 8 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| ALL chows | +1 | Every set is a chow |
| 2, 5, 8 as pair | +1 | Pair is 8 bamboo |
| Self-pick | +1 | Drew winning tile from wall |
| Only 2 suits | +1 | Bamboo + dots only |
| Can only win with one | +1 | Needed specifically the 8 bamboo to complete the pair — only one tile works |
| NO 1's or 9's, NO dragons / winds | +3 | No terminals, no honors. Not "Pure" (8 pts) because it uses two suits |
| Double chow | 0 | ~~2-3-4 in bamboo and dots~~ WRONG: double chow = same suit only |
| **Total** | **8** | |

**Point flow (winner is NOT dealer, first round):**
- Non-dealer loser 1 → Winner: 8
- Non-dealer loser 2 → Winner: 8
- Dealer → Winner: 8+1 = 9
- Score changes: Winner +25, Losers -8, -8, Dealer -9

**Point flow (winner IS dealer, first round):**
- Each loser → Dealer: 8+1 = 9
- Score changes: Dealer +27, each loser -9

**Key learnings:**
- A pair wait (needing the matching tile to complete your pair) IS a "can only win with one" situation.
- "Double chow" means two identical chows **in the same suit** (e.g., two 2-3-4 bamboo), NOT the same sequence across different suits.
- "1 thru 9 chain" (3 pts) also implicitly requires the **same suit**.
- "NO 1's or 9's, NO dragons / winds" (3 pts) is distinct from "Pure" (8 pts) — Pure requires one suit only, this allows multiple suits.
- Self-pick means ALL 3 losers pay, making it much more impactful than a discard win.

---

## Hand 3 — Pong-heavy, wind pong, discard win

**Tiles:**
- Pong: East Wind
- Pong: 3-3-3 bamboo
- Pong: 7-7-7 dots
- Chow: 4-5-6 characters
- Pair: 2 bamboo
- Won from discard (Player C discards 6 characters, completing the 4-5-6 chow)

**Hand value: 3 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| East Wind pong | +1 | Pong of any wind |
| 2, 5, 8 as pair | +1 | Pair is 2 bamboo |
| NO 1's or 9's with dragons / winds | +1 | No terminals, has honor tiles (wind) |
| Three suits w/ wind and dragon | 0 | Has 3 suits + wind but NO dragon — rule requires both |
| ALL pongs | 0 | Has a chow (4-5-6 characters) |
| Can only win with one | 0 | 4-5 characters waiting on 6 — but 3 also completes it |
| **Total** | **3** | |

**Point flow (Player C discarded, neither is dealer, first round):**
- Player C → Winner: 3
- Score changes: Winner +3, Player C -3

**Key learnings:**
- "Three suits w/ wind and dragon" requires BOTH wind AND dragon sets — not just one.
- "NO 1's or 9's with dragons / winds" (1 pt) triggers when the hand has no terminals and includes honor tiles. Don't confuse with the 3-pt version which requires NO honors either.

---

## Hand 4 — All Greens, all pongs, dealer self-pick

**Players:** A (dealer, round 1), B, C, D. A wins by self-pick.

**A's winning hand (drew 3 bamboo from wall):**
- Pong: 1-1-1 bamboo
- Pong: 5-5-5 bamboo
- Pong: 9-9-9 bamboo
- Pong: Green Dragon
- Pair: 3 bamboo (winning tile)

**Hand value: 20 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| All Greens | +14 | All bamboo + Green Dragon. Absorbs Semi-Pure and Green Dragon pong — don't double-count |
| ALL pongs | +4 | Separate — All Greens doesn't require all pongs |
| Self-pick | +1 | Drew from wall |
| Can only win with one | +1 | Pair wait — only 3 bamboo completes it |
| 2, 5, 8 as pair | 0 | Pair is 3 bamboo |
| **Hand value** | **20** | |

**Payment (self-pick, all 3 pay, dealer bonus on every transaction):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A (dealer) | 20 + 1 dealer | 21 |
| C → A (dealer) | 20 + 1 dealer | 21 |
| D → A (dealer) | 20 + 1 dealer | 21 |

**Score changes:** A: +63, B: -21, C: -21, D: -21

**Key learnings:**
- Special hands like All Greens **absorb** the rules they inherently satisfy (Semi-Pure, Green Dragon pong). Don't stack what's already baked in.
- ALL pongs stacks on top because All Greens can be achieved with chows too — it's a separate structural achievement.
- Always include dealer bonus in the final point flow, not just the hand value.
- All Greens (house rule): any bamboo tiles + Green Dragon. Standard definition is stricter (only 2,3,4,6,8 bamboo) but our group plays the loose version.

---

## Hand 5 — Clean doorstep, 1-9 chain, discard win

**Players:** A, B (dealer, round 1), C, D. C wins from D's discard.

**C's winning hand (all sets concealed, D discards 7 dots to complete):**
- Chow: 1-2-3 dots (concealed)
- Chow: 4-5-6 dots (concealed)
- Chow: 7-8-9 dots (completed by D's discard of 7)
- Pong: 4-4-4 bamboo (concealed)
- Pair: White Dragon

**Hand value: 5 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Clean doorstep | +1 | All sets formed from own draws — winning tile from discard is OK |
| 1 thru 9 chain | +3 | 1-9 all in dots (same suit) |
| Can only win with one | +1 | Had 8-9 dots, only 7 completes it |
| Only 2 suits | 0 | Dots + bamboo + White Dragon pair = 3 suits. **Even a pair of honors counts as a suit.** |
| ALL chows | 0 | Has a pong (4-4-4 bamboo) |
| **Hand value** | **5** | |

**Payment (discard win, D discarded, dealer B not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| D → C | 5 | 5 |

**Score changes:** A: 0, B: 0, C: +5, D: -5

**Key learnings:**
- **Clean doorstep** (門前清) = fully concealed hand. All sets formed from your own draws. Winning from a discard is still OK — the distinction is claiming discards to BUILD sets vs. claiming a discard as the WINNING tile.
- **Clean doorstep & self-pick** (3 pts) absorbs clean doorstep (1 pt) and self-pick (1 pt) — don't stack.
- When dealer is not part of the transaction (neither winner nor discarder), dealer bonus doesn't apply.

---

## Hand 6 — Clean doorstep & self-pick, three hidden pongs

**Players:** A, B, C (dealer, round 2 — extra round 1), D. D wins by self-pick.

**D's winning hand (all concealed, drew 5 characters from wall):**
- Pong: 2-2-2 dots (concealed)
- Pong: 6-6-6 dots (concealed)
- Pong: 9-9-9 bamboo (concealed)
- Chow: 4-5-6 characters (concealed)
- Pair: 5 characters (winning tile)

**Hand value: 12 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Clean doorstep & self-pick | +3 | All concealed + self-draw. Absorbs clean doorstep (1) and self-pick (1) |
| Three hidden pongs | +4 | Three concealed pongs |
| NO flowers and NO winds / dragons | +3 | No flowers, no honor tiles at all |
| Can only win with one | +1 | Pair wait — only 5 characters completes it |
| 2, 5, 8 as pair | +1 | Pair is 5 characters |
| **Hand value** | **12** | |

**Payment (self-pick, all 3 pay, dealer C extra round 1 = bonus 1+(1×2) = 3):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → D | 12 | 12 |
| B → D | 12 | 12 |
| C (dealer) → D | 12 + 3 dealer bonus | 15 |

**Score changes:** A: -12, B: -12, C: -15, D: +39

**Key learnings:**
- **NO flowers and NO winds / dragons** (3 pts) — easy to miss! Check every hand for absence of honors.
- Dealer bonus scales with extra rounds: round 1 = +1, extra round 1 = +3, extra round 2 = +5, etc.

---

## Hand 7 — Stolen kong, all from others

**Players:** A (dealer, round 1), B, C, D. B wins by stolen kong from A.

**B's winning hand (all sets claimed from discards, A upgrades pong to kong, B steals 8 dots):**
- Chow: 2-3-4 characters (claimed from discard)
- Chow: 6-7-8 characters (claimed from discard)
- Pong: North Wind (claimed from discard)
- Chow: 1-2-3 dots (claimed from discard)
- Pair: 8 dots (winning tile — stolen from A's kong)

**Hand value: 5 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Stolen Kong | +1 | Won by taking a tile from someone's kong upgrade |
| ALL from others | +1 | Every set claimed from others' discards |
| North Wind pong | +1 | Pong of any wind |
| Can only win with one | +1 | Pair wait — only 8 dots completes it |
| 2, 5, 8 as pair | +1 | Pair is 8 dots |
| Only 2 suits | 0 | Characters + dots + honors (wind) = 3 suits. **Honors count as a suit.** |
| **Hand value** | **5** | |

**Payment (A put the tile out, same as discard win, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A (dealer) → B | 5 + 1 dealer bonus | 6 |

**Score changes:** A: -6, B: +6, C: 0, D: 0

**Key learnings:**
- Stolen kong is just +1, payment follows normal discard rules (the kong-upgrader pays).
- ALL from others = every set was claimed from discards, nothing self-drawn. Opposite of clean doorstep.
- **Honors (winds/dragons) count as a suit** for "Only 2 suits". Bamboo + dots = 2 suits. Bamboo + dots + wind pong = 3 suits. Even a pair of honors counts.

---

## Hand 8 — Flower, wind pong, dealer discard win

**Players:** A, B (dealer, round 1), C, D. A wins from B's discard.

**A's winning hand (B discards 3 dots):**
- Chow: 1-2-3 dots (claimed from discard)
- Chow: 5-6-7 bamboo (claimed from discard)
- Pong: East Wind (claimed from discard)
- Chow: 3-4-5 dots (completed by B's discard of 3)
- Pair: 2 characters
- Flower: 1 flower tile

**Hand value: 3 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Flower | +1 | Has a flower tile |
| East Wind pong | +1 | Pong of any wind |
| 2, 5, 8 as pair | +1 | Pair is 2 characters |
| Can only win with one | 0 | 4-5 dots waiting on 3 or 6 |
| Only 2 suits | 0 | Dots + bamboo + characters + honors = 4 suits |
| Clean doorstep | 0 | Sets claimed from discards |
| **Hand value** | **3** | |

**Payment (B is dealer, discard win):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B (dealer) → A | 3 + 1 dealer bonus | 4 |

**Score changes:** A: +4, B: -4, C: 0, D: 0

**Key learnings:**
- **"Win from the butt"** = winning from a replacement draw (after declaring kong or picking up a flower). The "butt"/"tail" is the back end of the wall where replacement tiles come from. NOT about chow position.
- **"Win from last wall tile"** = separate rule, the very last regular draw from the wall.
- **"Win from last discard"** = separate rule, the final discard before the wall runs out.
- These are three distinct 1-point rules about different end-of-game scenarios.

---

## Hand 9 — Win from the butt, hidden kong, flowers

**Players:** A, B, C, D (dealer, round 1). C wins by self-pick from replacement draw.

**C's winning hand (C declares a concealed kong, draws replacement 6 bamboo from the butt):**
- Pong: 3-3-3 dots (claimed from discard)
- Kong: 8-8-8-8 characters (concealed)
- Chow: 4-5-6 bamboo (6 bamboo is winning tile, drawn from butt)
- Chow: 1-2-3 bamboo (claimed from discard)
- Pair: 5 dots
- Flowers: 2 flower tiles

**Hand value: 7 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Win from the butt | +1 | Won from replacement draw after declaring kong |
| Self-pick | +1 | Replacement draw counts as self-pick |
| Hidden kong | +2 | Concealed kong (kong + hidden) |
| Flower × 2 | +2 | 2 flower tiles, 1 point each |
| 2, 5, 8 as pair | +1 | Pair is 5 dots |
| Can only win with one | 0 | 4-5 bamboo waiting on 3 or 6 |
| Only 2 suits | 0 | Dots + characters + bamboo = 3 suits |
| Clean doorstep | 0 | Sets claimed from discards |
| **Hand value** | **7** | |

**Payment (self-pick, all 3 pay, D is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → C | 7 | 7 |
| B → C | 7 | 7 |
| D (dealer) → C | 7 + 1 dealer bonus | 8 |

**Score changes:** A: -7, B: -7, C: +22, D: -8

**Key learnings:**
- **Hidden kong** = +2 (kong bonus + concealed bonus). Remember to check if kongs are concealed or exposed.
- **Win from the butt** and **self-pick** both apply on replacement draws — they stack.
- Multiple flowers stack at +1 each.

---

## Hand 10 — Pure, four hidden pongs, self-pick

**Players:** A (dealer, round 1), B, C, D. B wins by self-pick.

**B's winning hand (all concealed, drew 4 dots from wall):**
- Pong: 1-1-1 dots (concealed)
- Pong: 3-3-3 dots (concealed)
- Pong: 6-6-6 dots (concealed)
- Pong: 9-9-9 dots (concealed)
- Pair: 4 dots (winning tile)

**Hand value: 27 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Four hidden pongs | +12 | Absorbs ALL pongs (4) and Three hidden pongs (4) |
| Pure | +8 | One suit only (dots), no honors |
| Clean doorstep & self-pick | +3 | All concealed + self-draw |
| NO flowers and NO winds / dragons | +3 | No flowers, no honors |
| Can only win with one | +1 | Pair wait — only 4 dots completes it |
| 2, 5, 8 as pair | 0 | Pair is 4 dots |
| **Hand value** | **27** | |

**Payment (self-pick, all 3 pay, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A (dealer) → B | 27 + 1 dealer bonus | 28 |
| C → B | 27 | 27 |
| D → B | 27 | 27 |

**Score changes:** A: -28, B: +82, C: -27, D: -27

**Key learnings:**
- **Four hidden pongs** (12 pts) absorbs ALL pongs (4 pts) and Three hidden pongs (4 pts) — both are inherently satisfied.
- **Pure** (8 pts) = one number suit, NO honors. Distinct from Semi-Pure (4 pts) which allows honors.
- Monster hands stack fast: four hidden pongs + pure + concealed self-pick + no honors = 27 before dealer bonus.

---

## Hand 11 — 1 thru 9 chain, split kong, clean doorstep

**Players:** A, B, C (dealer, round 1), D. D wins from A's discard.

**D's winning hand (A discards 9 bamboo):**
- Chow: 1-2-3 bamboo (concealed)
- Chow: 4-5-6 bamboo (concealed)
- Chow: 7-8-9 bamboo (completed by A's discard of 9)
- Pong: 5-5-5 bamboo (concealed)
- Pair: 8 dots
- Split kong: four 5 bamboos (three in pong + one in 4-5-6 chow)

**Hand value: 7 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| 1 thru 9 chain | +3 | 1-9 all in bamboo. Absorbs little and big chow (+1) |
| Split kong | +1 | Four 5 bamboos split across pong and chow |
| Clean doorstep | +1 | All sets concealed, won from discard |
| 2, 5, 8 as pair | +1 | Pair is 8 dots |
| Only 2 suits | +1 | Bamboo + dots |
| Can only win with one | 0 | 7-8 bamboo waiting on 6 or 9 |
| **Hand value** | **7** | |

**Payment (A discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → D | 7 | 7 |

**Score changes:** A: -7, B: 0, C: 0, D: +7

**Key learnings:**
- **Split kong** = all 4 copies of a tile in hand but not declared as a kong (e.g., pong of 5 + chow containing 5).
- **Little and big chow** = 1-2-3 and 7-8-9 in same suit. Absorbed by 1 thru 9 chain when all three sequential chows are present.
- **1 thru 9 chain** absorbs little and big chow — the chain inherently contains both terminal chows.

---

## Hand 12 — Three consecutive pongs

**Players:** A (dealer, round 1), B, C, D. C wins from D's discard.

**C's winning hand (D discards 2 dots):**
- Pong: 3-3-3 bamboo (claimed from discard)
- Pong: 4-4-4 bamboo (claimed from discard)
- Pong: 5-5-5 bamboo (claimed from discard)
- Chow: 6-7-8 dots (claimed from discard)
- Pair: 2 dots (winning tile)

**Hand value: 10 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Three consecutive pongs | +4 | 3-3-3, 4-4-4, 5-5-5 bamboo — consecutive numbers, same suit |
| NO 1's or 9's, NO dragons / winds | +3 | No terminals, no honors |
| 2, 5, 8 as pair | +1 | Pair is 2 dots |
| Can only win with one | +1 | Pair wait — only 2 dots completes it |
| Only 2 suits | +1 | Bamboo + dots |
| **Hand value** | **10** | |

**Payment (D discarded, A is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| D → C | 10 | 10 |

**Score changes:** A: 0, B: 0, C: +10, D: -10

**Key learnings:**
- **Three consecutive pongs** = three pongs of consecutive numbers in the same suit (e.g., 3-3-3, 4-4-4, 5-5-5).
- Easy to miss the 3-point "no terminals no honors" bonus — always scan for it.

---

## Hand 13 — Terminals & honors, all pongs, dealer discard win

**Players:** A, B (dealer, round 1), C, D. B wins from C's discard.

**B's winning hand (C discards 9 bamboo):**
- Pong: 1-1-1 dots (claimed from discard)
- Pong: 9-9-9 dots (claimed from discard)
- Pong: 9-9-9 bamboo (completed by C's discard of 9)
- Pong: East Wind (claimed from discard)
- Pair: White Dragon

**Hand value: 10 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Terminals & honors | +4 | Every set is a terminal or honor. Absorbs little and big pong (+1) |
| ALL pongs | +4 | Every set is a pong |
| East Wind pong | +1 | Pong of any wind |
| Can only win with one | +1 | Pair wait — only White Dragon completes it |
| **Hand value** | **10** | |

**Payment (C discarded, B is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| C → B (dealer) | 10 + 1 dealer bonus | 11 |

**Score changes:** A: 0, B: +11, C: -11, D: 0

**Key learnings:**
- **Terminals & honors** (4 pts) = every set is a terminal (1/9) or honor (wind/dragon). Absorbs little and big pong.
- The card's "Semi-mixed 1s/9s with dragons & winds" should be labeled **"Terminals & honors"** for clarity.
- There are only TWO terminal tiers, not three: terminals & honors (4 pts) and ALL 1's or 9's (16 pts). The 8-pt "Pure mixed 1s/9s" is a card error.

---

## Rule Clarifications Needed on Card

These rules are ambiguous as written and should specify "same suit":
1. **Double chow** → "Double chow (same suit)" — two identical chows in one suit
2. **1 thru 9 chain** → "1 thru 9 chain (same suit)" — sequential tiles 1-9 all in one suit

Clarifications needed:
3. **Only 2 suits** — honors (winds/dragons) count as a suit. "Only 2 suits" with a wind pong = 3 suits, doesn't qualify.
4. **"Semi-mixed 1s/9s with dragons & winds"** → rename to **"Terminals & honors"** — every set touches a 1/9 or is an honor.

## Hand 14 — Little dragons

**Players:** A, B, C (dealer, round 1), D. A wins from B's discard.

**A's winning hand (B discards 6 bamboo):**
- Pong: Red Dragon (claimed from discard)
- Pong: Green Dragon (claimed from discard)
- Chow: 4-5-6 bamboo (completed by B's discard of 6)
- Chow: 2-3-4 dots (claimed from discard)
- Pair: White Dragon

**Hand value: 8 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Little dragons | +8 | Two dragon pongs + pair of the third dragon. Absorbs individual dragon pongs (+1 each) |
| Can only win with one | 0 | 4-5 bamboo waiting on 3 or 6 |
| **Hand value** | **8** | |

**Payment (B discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A | 8 | 8 |

**Score changes:** A: +8, B: -8, C: 0, D: 0

**Key learnings:**
- **Little dragons** (8 pts) = two dragon pongs + pair of the third. Absorbs individual dragon pong bonuses.
- **Big dragons** (12 pts) = pongs of all three dragons. Absorbs little dragons and individual dragon pongs.

---

## Hand 15 — Three suit chow, double chow, all chows

**Players:** A, B, C, D (dealer, round 1). A wins from D's discard.

**A's winning hand (D discards 5 characters):**
- Chow: 3-4-5 bamboo (concealed)
- Chow: 3-4-5 bamboo (concealed)
- Chow: 3-4-5 dots (concealed)
- Chow: 3-4-5 characters (completed by D's discard of 5)
- Pair: 8 dots

**Hand value: 11 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Three suit chow | +4 | 3-4-5 in bamboo, dots, and characters |
| NO 1's or 9's, NO dragons / winds | +3 | No terminals, no honors |
| Double chow | +1 | Two 3-4-5 bamboo — identical chow in same suit |
| ALL chows | +1 | Every set is a chow |
| Clean doorstep | +1 | All sets concealed, won from discard |
| 2, 5, 8 as pair | +1 | Pair is 8 dots |
| Can only win with one | 0 | 3-4 characters waiting on 2 or 5 |
| **Hand value** | **11** | |

**Payment (D is dealer, discard win):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| D (dealer) → A | 11 + 1 dealer bonus | 12 |

**Score changes:** A: +12, B: 0, C: 0, D: -12

**Key learnings:**
- **Three suit chow** (4 pts) = same-number chow in all 3 number suits (e.g., 3-4-5 bamboo + 3-4-5 dots + 3-4-5 characters).
- **Double chow** (1 pt) and three suit chow (4 pts) can stack — they're independent patterns.

---

## Hand 16 — ALL 1's or 9's, three suit pongs, all pongs

**Players:** A (dealer, extra round 4), B, C, D. B wins by self-pick.

**B's winning hand (drew 1 characters from wall):**
- Pong: 9-9-9 bamboo (claimed from discard)
- Pong: 9-9-9 dots (claimed from discard)
- Pong: 9-9-9 characters (claimed from discard)
- Pong: 1-1-1 dots (claimed from discard)
- Pair: 1 characters (winning tile)

**Hand value: 26 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| ALL 1's or 9's | +16 | Every tile is a 1 or 9. Absorbs terminals & honors (4) and little and big pong (1) |
| Three suit pongs | +4 | 9-9-9 in bamboo, dots, and characters |
| ALL pongs | +4 | Every set is a pong |
| Self-pick | +1 | Drew from wall |
| Can only win with one | +1 | Pair wait — only 1 characters completes it |
| **Hand value** | **26** | |

**Dealer bonus: 1 + (4 × 2) = 9**

**Payment (self-pick, all 3 pay, A is dealer extra round 4):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A (dealer) → B | 26 + 9 dealer bonus | 35 |
| C → B | 26 | 26 |
| D → B | 26 | 26 |

**Score changes:** A: -35, B: +87, C: -26, D: -26

**Key learnings:**
- **ALL 1's or 9's** (16 pts) = every tile is a 1 or 9. Forces all pongs (can't make chows). Absorbs terminals & honors (4 pts).
- **Three suit pongs** (4 pts) = same-number pong in all 3 number suits.
- Dealer bonus on extra round 4 = 1 + (4 × 2) = 9. Stacks up fast.

---

## Hand 17 — Four consecutive pongs, semi-pure

**Players:** A, B (dealer, round 1), C, D. C wins from A's discard.

**C's winning hand (A discards West Wind):**
- Pong: 4-4-4 dots (claimed from discard)
- Pong: 5-5-5 dots (claimed from discard)
- Pong: 6-6-6 dots (claimed from discard)
- Pong: 7-7-7 dots (claimed from discard)
- Pair: West Wind (winning tile)

**Hand value: 14 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Four consecutive pongs | +8 | 4, 5, 6, 7 dots. Absorbs ALL pongs (4) and three consecutive pongs (4) |
| Semi-Pure | +4 | One suit (dots) + honors (wind pair) |
| NO 1's or 9's with dragons / winds | +1 | No terminals, has honors |
| Can only win with one | +1 | Pair wait — only West Wind completes it |
| **Hand value** | **14** | |

**Payment (A discarded, B is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → C | 14 | 14 |

**Score changes:** A: -14, B: 0, C: +14, D: 0

**Key learnings:**
- **Four consecutive pongs** (8 pts) absorbs ALL pongs (4 pts) and three consecutive pongs (4 pts).

---

## Hand 18 — Big dragons, semi-pure

**Players:** A, B, C (dealer, round 1), D. D wins from B's discard.

**D's winning hand (B discards 3 bamboo, D held 2-3 bamboo):**
- Pong: Red Dragon (claimed from discard)
- Pong: Green Dragon (claimed from discard)
- Pong: White Dragon (claimed from discard)
- Chow: 1-2-3 bamboo (completed by B's discard of 3)
- Pair: 6 bamboo

**Hand value: 16 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Big dragons | +12 | Pongs of all 3 dragons. Absorbs little dragons (8) and individual dragon pongs (1 each) |
| Semi-Pure | +4 | One suit (bamboo) + honors (dragons) |
| Can only win with one | 0 | 2-3 bamboo waiting on 1 or 4 |
| **Hand value** | **16** | |

**Payment (B discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → D | 16 | 16 |

**Score changes:** A: 0, B: -16, C: 0, D: +16

**Key learnings:**
- **Big dragons** (12 pts) = pongs of all 3 dragons. Absorbs little dragons (8 pts) and all individual dragon pongs (1 pt each).

---

## Hand 19 — Little winds, self-pick

**Players:** A (dealer, round 1), B, C, D. A wins by self-pick.

**A's winning hand (drew 4 bamboo from wall):**
- Pong: East Wind (claimed from discard)
- Pong: South Wind (claimed from discard)
- Pong: West Wind (claimed from discard)
- Chow: 3-4-5 bamboo (3-5 in hand, drew 4 from wall)
- Pair: North Wind

**Hand value: 14 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Little winds | +12 | Three wind pongs + pair of the fourth. Absorbs individual wind pongs (1 each) |
| Self-pick | +1 | Drew from wall |
| Can only win with one | +1 | 3-5 bamboo, only 4 completes it |
| **Hand value** | **14** | |

**Payment (self-pick, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A (dealer) | 14 + 1 dealer bonus | 15 |
| C → A (dealer) | 14 + 1 dealer bonus | 15 |
| D → A (dealer) | 14 + 1 dealer bonus | 15 |

**Score changes:** A: +45, B: -15, C: -15, D: -15

**Key learnings:**
- **Little winds** (12 pts) = three wind pongs + pair of the fourth. Absorbs individual wind pongs.
- **Big winds** (18 pts) = pongs of all four winds. Absorbs little winds and individual wind pongs.
- 3-5 waiting on 4 (middle wait) IS a "can only win with one" situation.

---

## Hand 20 — ALL honors

**Players:** A, B (dealer, round 1), C, D. C wins from D's discard.

**C's winning hand (D discards South Wind):**
- Pong: East Wind (claimed from discard)
- Pong: North Wind (claimed from discard)
- Pong: Red Dragon (claimed from discard)
- Pong: White Dragon (claimed from discard)
- Pair: South Wind (winning tile)

**Hand value: 13 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| ALL honors | +12 | Every tile is a wind or dragon. Absorbs ALL pongs (4) and individual wind/dragon pongs (1 each) |
| Can only win with one | +1 | Pair wait — only South Wind completes it |
| **Hand value** | **13** | |

**Payment (D discarded, B is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| D → C | 13 | 13 |

**Score changes:** A: 0, B: 0, C: +13, D: -13

**Key learnings:**
- **ALL honors** (12 pts) absorbs ALL pongs (4 pts) and all individual wind/dragon pong bonuses — honors can only form pongs, so all pongs is inherent.

---

## Hand 21 — ALL pairs ("The Delphine")

**Players:** A, B, C, D (dealer, round 1). B wins by self-pick.

**B's winning hand (drew 7 dots from wall, all concealed):**
- Pair: 2-2 bamboo
- Pair: 5-5 bamboo
- Pair: 9-9 bamboo
- Pair: 3-3 dots
- Pair: 7-7 dots (winning tile)
- Pair: East Wind
- Pair: Red Dragon

**Hand value: 13 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| ALL pairs | +12 | Seven pairs. Absorbs clean doorstep (must be concealed — can't claim discards to build pairs) |
| Self-pick | +1 | Drew from wall. If had won from discard, "can only win with one" (+1) would apply instead. Either way = +1 |
| **Hand value** | **13** | |

**Payment (self-pick, D is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → B | 13 | 13 |
| C → B | 13 | 13 |
| D (dealer) → B | 13 + 1 dealer bonus | 14 |

**Score changes:** A: -13, B: +40, C: -13, D: -14

**Key learnings:**
- **ALL pairs** (12 pts) absorbs clean doorstep — pairs can't be built from discards, so always concealed.
- ALL pairs always scores exactly 13: 12 + 1 (self-pick OR can only win with one — one always applies).

---

## Hand 22 — Thirteen Orphans

**Players:** A (dealer, round 1), B, C, D. A wins by self-pick.

**A's winning hand (drew 9 characters from wall, all concealed):**
- 1 bamboo, 9 bamboo, 1 dots, 9 dots, 1 characters, 9 characters (winning tile)
- East, South, West, North Wind
- Red, Green, White Dragon
- Pair: 1 bamboo (the duplicate)

**Hand value: 16 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Thirteen Orphans | +14 | One of each terminal and honor, plus one duplicate. Absorbs all sub-patterns |
| Self-pick | +1 | Drew from wall |
| Can only win with one | +1 | Only 9 characters completes the hand |
| **Hand value** | **16** | |

**Payment (self-pick, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A (dealer) | 16 + 1 dealer bonus | 17 |
| C → A (dealer) | 16 + 1 dealer bonus | 17 |
| D → A (dealer) | 16 + 1 dealer bonus | 17 |

**Score changes:** A: +51, B: -17, C: -17, D: -17

**Key learnings:**
- **Thirteen Orphans** (14 pts) = one of each terminal (1 and 9 in each suit) + one of each honor (4 winds + 3 dragons) + one duplicate as pair. 13 unique tiles + 1 pair = 14 tiles.
- Absorbs all sub-patterns — it's its own unique structure.

---

## Hand 23 — Two double chows

**Players:** A, B (dealer, round 1), C, D. D wins from C's discard.

**D's winning hand (all concealed, C discards 8 dots):**
- Chow: 2-3-4 bamboo (concealed)
- Chow: 2-3-4 bamboo (concealed)
- Chow: 7-8-9 dots (concealed)
- Chow: 7-8-9 dots (completed by C's discard of 8, had 7-9)
- Pair: 5 characters

**Hand value: 16 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Two double chows | +12 | Two pairs of identical same-suit chows. Absorbs double chow (1 each) |
| ALL chows | +1 | Every set is a chow |
| Clean doorstep | +1 | All sets concealed, won from discard |
| 2, 5, 8 as pair | +1 | Pair is 5 characters |
| Can only win with one | +1 | 7-9 dots, only 8 completes it |
| Only 2 suits | 0 | Bamboo + dots + characters (pair) = 3 suits |
| **Hand value** | **16** | |

**Payment (C discarded, B is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| C → D | 16 | 16 |

**Score changes:** A: 0, B: 0, C: -16, D: +16

**Key learnings:**
- **Two double chows** (12 pts) = two pairs of identical same-suit chows (e.g., two 2-3-4 bamboo + two 7-8-9 dots). Absorbs individual double chow bonuses.

---

## Hand 24 — Two kong mahjong

**Players:** A, B, C (dealer, round 1), D. A wins from B's discard.

**A's winning hand (B discards 6 dots):**
- Kong: 3-3-3-3 bamboo (exposed)
- Kong: 7-7-7-7 characters (exposed)
- Chow: 4-5-6 dots (completed by B's discard of 6)
- Pong: 2-2-2 dots (claimed from discard)
- Pair: 8 bamboo

**Hand value: 7 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Two kong mahjong | +6 | Hand includes 2 kongs |
| 2, 5, 8 as pair | +1 | Pair is 8 bamboo |
| Can only win with one | 0 | 4-5 dots waiting on 3 or 6 |
| **Hand value** | **7** | |

**Payment (B discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A | 7 | 7 |

**Score changes:** A: +7, B: -7, C: 0, D: 0

**Key learnings:**
- **Two kong mahjong** (6 pts) = hand has 2 kongs of any kind (exposed or concealed).

---

## Hand 25 — Heavenly Gates

**Players:** A, B, C, D (dealer, round 1). C wins by self-pick.

**C's winning hand (all concealed, drew 5 dots from wall):**
- Final 14 tiles: 1-1-1-2-3-4-5-5-6-7-8-9-9-9 dots
- Pattern: 1112345678999 + matching tile (5 dots)

**Hand value: 17 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Heavenly Gates | +16 | 1112345678999 in one suit + matching tile. Absorbs Pure (8), clean doorstep (1) |
| Self-pick | +1 | Drew from wall |
| Can only win with one | 0 | Pattern can accept any tile 1-9 in the suit |
| **Hand value** | **17** | |

**Payment (self-pick, D is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → C | 17 | 17 |
| B → C | 17 | 17 |
| D (dealer) → C | 17 + 1 dealer bonus | 18 |

**Score changes:** A: -17, B: -17, C: +52, D: -18

**Key learnings:**
- **Heavenly Gates** (16 pts) = 1112345678999 in one suit + any matching tile. Absorbs Pure and clean doorstep.
- The pattern can wait on any tile 1-9 in the suit, so "can only win with one" never applies.

---

## Hand 26 — Heavenly Hand

**Players:** A (dealer, round 1), B, C, D. A wins immediately.

**A's initial 14 tiles (dealt as dealer, no draws needed):**
- Pong: 3-3-3 bamboo
- Pong: 7-7-7 dots
- Chow: 4-5-6 characters
- Chow: 1-2-3 dots
- Pair: 8 bamboo

**Hand value: 21 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Heavenly Hand | +20 | Dealer wins with initial dealt hand, no draws |
| 2, 5, 8 as pair | +1 | Pair is 8 bamboo |
| **Hand value** | **21** | |

**Payment (all 3 pay, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A (dealer) | 21 + 1 dealer bonus | 22 |
| C → A (dealer) | 21 + 1 dealer bonus | 22 |
| D → A (dealer) | 21 + 1 dealer bonus | 22 |

**Score changes:** A: +66, B: -22, C: -22, D: -22

**Key learnings:**
- **Heavenly Hand** (20 pts) = dealer wins with initial 14-tile deal. No draws, no discards. Always the dealer, always all 3 pay.

---

## Hand 27 — Earthly Hand

**Players:** A (dealer, round 1), B, C, D. B wins from A's first discard.

**B's winning hand (A discards 2 bamboo as first discard, B held 1-3 bamboo):**
- Chow: 1-2-3 bamboo (completed by A's first discard of 2)
- Pong: 6-6-6 dots
- Chow: 4-5-6 characters
- Pong: 9-9-9 bamboo
- Pair: 5 dots

**Hand value: 18 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Earthly Hand | +16 | Non-dealer wins on dealer's first discard |
| 2, 5, 8 as pair | +1 | Pair is 5 dots |
| Can only win with one | +1 | 1-3 bamboo, only 2 completes it |
| **Hand value** | **18** | |

**Payment (A discarded, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A (dealer) → B | 18 + 1 dealer bonus | 19 |

**Score changes:** A: -19, B: +19, C: 0, D: 0

**Key learnings:**
- **Earthly Hand** (16 pts) = non-dealer wins on dealer's very first discard. Always a discard win, always dealer pays.

---

## Hand 28 — Big winds

**Players:** A, B, C (dealer, round 1), D. D wins from A's discard.

**D's winning hand (A discards 3 bamboo):**
- Pong: East Wind (claimed from discard)
- Pong: South Wind (claimed from discard)
- Pong: West Wind (claimed from discard)
- Pong: North Wind (claimed from discard)
- Pair: 3 bamboo (winning tile)

**Hand value: 19 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Big winds | +18 | Pongs of all 4 winds. Absorbs little winds (12), individual wind pongs (1 each), ALL pongs (4) |
| Can only win with one | +1 | Pair wait — only 3 bamboo completes it |
| **Hand value** | **19** | |

**Payment (A discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → D | 19 | 19 |

**Score changes:** A: -19, B: 0, C: 0, D: +19

**Key learnings:**
- **Big winds** (18 pts) = pongs of all 4 winds. Absorbs little winds (12), individual wind pongs (1 each), and ALL pongs (4).

---

## Hand 29 — ALL kongs

**Players:** A (dealer, round 1), B, C, D. B wins by self-pick (replacement draw after 4th kong).

**B's winning hand (declared 4th kong, drew 2 dots from butt):**
- Kong: 4-4-4-4 bamboo (exposed)
- Kong: 7-7-7-7 bamboo (exposed)
- Kong: 3-3-3-3 dots (concealed)
- Kong: 9-9-9-9 characters (exposed)
- Pair: 2 dots (winning tile, drawn from butt)

**Hand value: 20 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| ALL kongs | +14 | All 4 sets are kongs. Absorbs two kong mahjong (6) and ALL pongs (4) |
| Hidden kong | +2 | 3-3-3-3 dots was concealed |
| Win from the butt | +1 | Replacement draw after declaring kong |
| Self-pick | +1 | Drew from wall |
| 2, 5, 8 as pair | +1 | Pair is 2 dots |
| Can only win with one | +1 | Pair wait — only 2 dots completes it |
| **Hand value** | **20** | |

**Payment (self-pick, A is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A (dealer) → B | 20 + 1 dealer bonus | 21 |
| C → B | 20 | 20 |
| D → B | 20 | 20 |

**Score changes:** A: -21, B: +61, C: -20, D: -20

**Key learnings:**
- **ALL kongs** (14 pts) = all 4 sets are kongs. Absorbs two kong mahjong (6) and ALL pongs (4).
- ALL kongs naturally pairs with win from the butt and self-pick since the last kong requires a replacement draw.
- Hidden kong (+2) stacks on top for any concealed kongs within the hand.

---

## Hand 30 — Prodigy Hand

**Players:** A, B (dealer, round 1), C, D. C declares ready, wins from D's discard within first 4 discards.

**C's winning hand (D discards 5 bamboo, C held 4-6 bamboo):**
- Chow: 4-5-6 bamboo (completed by D's discard of 5)
- Pong: 8-8-8 dots (concealed)
- Chow: 1-2-3 characters (concealed)
- Chow: 7-8-9 characters (concealed)
- Pair: 2 dots

**Hand value: 15 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Prodigy Hand | +12 | Declared ready, won within first 4 discards |
| Clean doorstep | +1 | All sets concealed, won from discard |
| 2, 5, 8 as pair | +1 | Pair is 2 dots |
| Can only win with one | +1 | 4-6 bamboo, only 5 completes it |
| **Hand value** | **15** | |

**Payment (D discarded, B is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| D → C | 15 | 15 |

**Score changes:** A: 0, B: 0, C: +15, D: -15

**Key learnings:**
- **Prodigy Hand** (12 pts) = declare ready (uno) and win within first 4 discards.
- Clean doorstep stacks (+1) since the hand is concealed from the deal. Heavenly/Earthly hands absorb it, but Prodigy doesn't.

---

## Hand 31 — Three suits w/ wind and dragon

**Players:** A (dealer, round 1), B, C, D. B wins from C's discard.

**B's winning hand (C discards 9 dots):**
- Pong: 1-1-1 bamboo (claimed from discard)
- Pong: 9-9-9 dots (completed by C's discard of 9)
- Chow: 4-5-6 characters (claimed from discard)
- Pong: South Wind (claimed from discard)
- Pair: Red Dragon

**Hand value: 2 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Three suits w/ wind and dragon | +1 | All 3 number suits (bamboo, dots, characters) + wind + dragon |
| South Wind pong | +1 | Pong of any wind |
| Little and big pong | 0 | 1 bamboo + 9 dots = different suits, must be same suit |
| Can only win with one | 0 | Could win with 9 dots (pong) or Red Dragon (pair) — two options |
| **Hand value** | **2** | |

**Payment (C discarded, A is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| C → B | 2 | 2 |

**Score changes:** A: 0, B: +2, C: -2, D: 0

**Key learnings:**
- **Three suits w/ wind and dragon** (1 pt) = all 3 number suits represented + at least one wind + at least one dragon in the hand.
- **Little and big pong** = pong of 1 and pong of 9 in the **same suit**. Like little and big chow.
- When waiting on a pong OR a pair, two tiles can win — "can only win with one" doesn't apply.

---

## Hand 32 — Win from last wall tile

**Players:** A, B (dealer, round 1), C, D. A wins by self-pick on the last regular tile before the butt.

**A's winning hand (drew 6 dots — the last tile before the butt):**
- Chow: 4-5-6 dots (completed by last wall tile)
- Chow: 1-2-3 bamboo (claimed from discard)
- Pong: West Wind (claimed from discard)
- Chow: 7-8-9 characters (claimed from discard)
- Pair: 5 bamboo

**Hand value: 4 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Win from last wall tile | +1 | Drew the last regular tile before the butt |
| Self-pick | +1 | Drew from wall |
| West Wind pong | +1 | Pong of any wind |
| 2, 5, 8 as pair | +1 | Pair is 5 bamboo |
| Can only win with one | 0 | 4-5 dots waiting on 3 or 6 |
| **Hand value** | **4** | |

**Payment (self-pick, B is dealer):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B (dealer) → A | 4 + 1 dealer bonus | 5 |
| C → A | 4 | 4 |
| D → A | 4 | 4 |

**Score changes:** A: +13, B: -5, C: -4, D: -4

---

## Hand 33 — Win from last discard

**Players:** A, B, C (dealer, round 1), D. A draws the last tile before the butt, doesn't win, discards 2 bamboo. D claims it.

**D's winning hand (A discards 2 bamboo after drawing the last regular tile):**
- Chow: 1-2-3 bamboo (completed by A's discard of 2, D held 1-3)
- Pong: 6-6-6 dots (claimed from discard)
- Chow: 4-5-6 characters (claimed from discard)
- Pong: 8-8-8 bamboo (claimed from discard)
- Pair: 2 dots

**Hand value: 3 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Win from last discard | +1 | Someone drew the last regular tile, discarded, and D claimed it |
| 2, 5, 8 as pair | +1 | Pair is 2 dots |
| Can only win with one | +1 | 1-3 bamboo, only 2 completes it |
| **Hand value** | **3** | |

**Payment (A discarded, C is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| A → D | 3 | 3 |

**Score changes:** A: -3, B: 0, C: 0, D: +3

**Key learnings:**
- The **butt** = last 8 pairs (16 tiles) of the wall, reserved for replacement draws (kong/flower).
- **Win from last wall tile** = self-pick on the final regular draw before the butt.
- **Win from last discard** = someone drew the last regular tile, discarded, and you claim it to win.
- Both rules are about the same moment — the final regular draw. Difference is who wins (drawer vs. claimer).
- **Win from the butt** (Hand 9) is different — that's winning from a replacement draw taken from the butt section.

---

## Hand 34 — Little and big pong

**Players:** A, B, C, D (dealer, round 1). A wins from B's discard.

**A's winning hand (B discards 7 characters):**
- Pong: 1-1-1 dots (claimed from discard)
- Pong: 9-9-9 dots (claimed from discard)
- Chow: 5-6-7 characters (completed by B's discard of 7)
- Chow: 2-3-4 bamboo (claimed from discard)
- Pair: 8 bamboo

**Hand value: 2 points**
| Rule | Points | Reasoning |
|------|--------|-----------|
| Little and big pong | +1 | Pong of 1 dots and pong of 9 dots — same suit |
| 2, 5, 8 as pair | +1 | Pair is 8 bamboo |
| Can only win with one | 0 | 5-6 characters waiting on 4 or 7 |
| **Hand value** | **2** | |

**Payment (B discarded, D is dealer, not involved):**
| From → To | Calculation | Amount |
|-----------|-------------|--------|
| B → A | 2 | 2 |

**Score changes:** A: +2, B: -2, C: 0, D: 0

**Key learnings:**
- **Little and big pong** (1 pt) = pong of 1 and pong of 9 in the **same suit**. Same-suit requirement matches little and big chow.

---

## House Rules

- **Flowers** = 1 point each, simple. No distinction between flowers and seasons.
- **Wind pongs** = 1 point each. No seat wind or round wind bonus.
- **Exposed kong** = 1 point. Hidden (concealed) kong = 2 points.
- **Dead round** (wall exhausted, no winner) = no scoring. Dealer stays dealer (doesn't rotate).

---

## Rule Clarifications Needed on Card

Ambiguous wording — should specify "same suit":
1. **Double chow** → "Double chow (same suit)" — two identical chows in one suit
2. **1 thru 9 chain** → "1 thru 9 chain (same suit)" — sequential tiles 1-9 all in one suit

Clarifications needed:
3. **Only 2 suits** — honors (winds/dragons) count as a suit. Even a pair of honors counts.
4. **"Semi-mixed 1s/9s with dragons & winds"** → rename to **"Terminals & honors"** — every set touches a 1/9 or is an honor.
5. **Clean doorstep** (門前清) = fully concealed hand, not about consecutive chows.

Card errors:
6. **"Pure mixed 1s/9s, NO dragons/winds" (8 pts)** — should be removed. Only two terminal tiers exist: terminals & honors (4 pts) and ALL 1's or 9's (16 pts).

Missing from card:
7. **All Greens** (綠一色) — all bamboo + Green Dragon. House rule: ANY bamboo tiles qualify (not just green-ink 2,3,4,6,8). Score: **14 points**.
8. **Exposed kong** = +1 point. Add to card.
9. **Hidden kong** = +2 points (kong + concealed bonus). Add to card.

## Absorption Rules (higher tier absorbs lower)

- **1 thru 9 chain** (3) absorbs **little and big chow** (1) and **clean doorstep** (1, when applicable)
- **Clean doorstep & self-pick** (3) absorbs **clean doorstep** (1) and **self-pick** (1)
- **Four consecutive pongs** (8) absorbs **ALL pongs** (4) and **three consecutive pongs** (4)
- **Four hidden pongs** (12) absorbs **ALL pongs** (4) and **three hidden pongs** (4)
- **Two double chows** (12) absorbs **double chow** (1 each)
- **Little dragons** (8) absorbs individual **dragon pongs** (1 each)
- **Big dragons** (12) absorbs **little dragons** (8) and individual **dragon pongs** (1 each)
- **Little winds** (12) absorbs individual **wind pongs** (1 each)
- **Big winds** (18) absorbs **little winds** (12), individual **wind pongs** (1 each), and **ALL pongs** (4)
- **ALL honors** (12) absorbs **ALL pongs** (4) and individual wind/dragon pongs (1 each)
- **ALL pairs** (12) absorbs **clean doorstep** (1)
- **ALL 1's or 9's** (16) absorbs **terminals & honors** (4) and **little and big pong** (1)
- **Heavenly Gates** (16) absorbs **Pure** (8) and **clean doorstep** (1)
- **All Greens** (14) absorbs **Semi-Pure** (4) and **Green Dragon pong** (1)
- **Terminals & honors** (4) absorbs **little and big pong** (1)

---
