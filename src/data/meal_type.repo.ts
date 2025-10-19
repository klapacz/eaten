import { DB } from '@/db/client'
import { mealTypeTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function listUserMealTypes(filter: { userId: string }) {
  return DB.use((db) =>
    db
      .select()
      .from(mealTypeTable)
      .where(eq(mealTypeTable.userId, filter.userId))
      .execute(),
  )
}

export async function getUserMealTypeByName(filter: {
  userId: string
  mealTypeName: string
}) {
  const [record] = await DB.use((db) =>
    db
      .select()
      .from(mealTypeTable)
      .where(
        and(
          eq(mealTypeTable.userId, filter.userId),
          eq(mealTypeTable.name, filter.mealTypeName),
        ),
      )
      .execute(),
  )
  if (!record) throw new Error('Meal type not found')
  return record
}

export async function getUserMealTypeById(filter: {
  userId: string
  mealTypeId: string
}) {
  const [record] = await DB.use((db) =>
    db
      .select()
      .from(mealTypeTable)
      .where(
        and(
          eq(mealTypeTable.userId, filter.userId),
          eq(mealTypeTable.id, filter.mealTypeId),
        ),
      )
      .execute(),
  )
  if (!record) throw new Error('Meal type not found')
  return record
}

export async function createDefaultMealTypesForUser({
  userId,
}: {
  userId: string
}) {
  await DB.createTx(async () => {
    await DB.use((db) =>
      db
        .insert(mealTypeTable)
        .values([
          { userId, name: 'Breakfast', defaultTime: '07:00' },
          { userId, name: 'Lunch', defaultTime: '12:00' },
          { userId, name: 'Dinner', defaultTime: '19:00' },
        ])
        .execute(),
    )
  })
}
