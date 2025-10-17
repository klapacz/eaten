import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { createServerFn } from '@tanstack/react-start'
import { DB } from '@/db/client'
import { mealTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { generateTxId } from '@/db/tx'
import { mealSchema } from '@/schemas/meal'
import z from 'zod'
import { AuthContext } from '@/auth/server'

const updateMealServer = createServerFn({ method: 'POST' })
  .inputValidator(mealSchema)
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      const { id, ...rest } = data

      const [meal] = await DB.use((db) =>
        db
          .select()
          .from(mealTable)
          .where(
            and(eq(mealTable.id, id), eq(mealTable.userId, session.user.id)),
          ),
      )

      await DB.use((db) =>
        db.update(mealTable).set(rest).where(eq(mealTable.id, meal.id)),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

const createMealServer = createServerFn({ method: 'POST' })
  .inputValidator(mealSchema)
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      await DB.use((db) =>
        db.insert(mealTable).values({ ...data, userId: session.user.id }),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

const removeMealServer = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      await DB.use((db) =>
        db
          .delete(mealTable)
          .where(
            and(
              eq(mealTable.id, data.id),
              eq(mealTable.userId, session.user.id),
            ),
          ),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

export const mealCollection = createCollection(
  electricCollectionOptions({
    shapeOptions: {
      url:
        typeof window !== 'undefined'
          ? new URL('/api/sync/meal', window.location.origin).toString()
          : '',
    },
    schema: mealSchema,
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const originalMeal = transaction.mutations[0].original
      const modifiedMeal = transaction.mutations[0].modified
      const response = await updateMealServer({
        data: { ...modifiedMeal, id: originalMeal.id },
      })

      return { txid: response.txid }
    },
    onInsert: async ({ transaction }) => {
      const newMeal = transaction.mutations[0].modified
      const response = await createMealServer({ data: newMeal })

      return { txid: response.txid }
    },
    onDelete: async ({ transaction }) => {
      const deletedMeal = transaction.mutations[0].original
      const response = await removeMealServer({ data: deletedMeal })

      return { txid: response.txid }
    },
  }),
)
