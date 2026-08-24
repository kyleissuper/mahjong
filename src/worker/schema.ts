import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  code: text('code').primaryKey(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  expired: integer('expired', { mode: 'boolean' }).notNull().default(false),
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

export const hands = sqliteTable('hands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionCode: text('session_code').notNull().references(() => sessions.code),
  timestamp: text('timestamp').notNull(),
  // Name snapshot at time of play (archival); identity lives in winnerId.
  winner: text('winner').notNull(),
  winnerId: text('winner_id'),
  method: text('method').notNull(),
  handValue: real('hand_value').notNull(),
  appliedRules: text('applied_rules', { mode: 'json' }).notNull(),
  dealerBonus: real('dealer_bonus').notNull().default(0),
  melds: text('melds', { mode: 'json' }).notNull(),
  scores: text('scores', { mode: 'json' }).notNull(),
  timing: text('timing', { mode: 'json' }),
});
