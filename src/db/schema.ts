import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { auth_user } from './auth.schema'

export const mealTypeEnum = pgEnum('MealType', [
  'BREAKFAST',
  'BRUNCH',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
])

export const mealTable = pgTable('meal', {
  datetime: timestamp({ mode: 'string' }).notNull(),
  id: uuid().defaultRandom().primaryKey(),
  type: mealTypeEnum().notNull(),
  items: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  userId: text()
    .notNull()
    .references(() => auth_user.id),
})

export * from './auth.schema'
