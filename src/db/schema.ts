import { sql } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { auth_user } from './auth.schema'
import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'

export const mealTypeTable = pgTable(
  'meal_type',
  {
    id: uuid().defaultRandom().primaryKey(),
    defaultTime: time().notNull(),
    name: text().notNull(),
    considerTime: boolean().notNull().default(true),
    userId: text()
      .notNull()
      .references(() => auth_user.id),
    color: text()
      .notNull()
      .$type<MealTypeColorUtils.ColorName>()
      .default('gray'),
  },
  (t) => [unique().on(t.userId, t.name)],
)

export const mealTable = pgTable('meal', {
  datetime: timestamp({ mode: 'string' }).notNull(),
  mealTypeId: uuid()
    .notNull()
    .references(() => mealTypeTable.id),
  id: uuid().defaultRandom().primaryKey(),
  items: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  userId: text()
    .notNull()
    .references(() => auth_user.id),
})

export * from './auth.schema'
