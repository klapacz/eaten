import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core'

export const mealTypeEnum = pgEnum('MealType', [
  'BREAKFAST',
  'BRUNCH',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
])

export const mealTable = pgTable('meal', {
  id: uuid().defaultRandom().primaryKey(),
  type: mealTypeEnum().notNull(),
  items: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
})
