import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { createServerFn } from '@tanstack/react-start'
import { DB } from '@/db/client'
import { mealTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateTxId } from '@/db/tx'
import { mealSchema } from '@/schemas/meal'

const updateMealServer = createServerFn({ method: 'POST' })
  .inputValidator(mealSchema)
  .handler(async ({ data }) => {
    return await DB.createTx(async (tx) => {
      const { id, ...rest } = data

      const [meal] = await DB.use((db) =>
        db.select().from(mealTable).where(eq(mealTable.id, id)),
      )

      await DB.use((db) =>
        db.update(mealTable).set(rest).where(eq(mealTable.id, meal.id)),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

export const mealCollection = createCollection(
  electricCollectionOptions({
    shapeOptions: {
      url: 'http://localhost:3000/v1/shape?table=meal&offset=-1',
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
  }),
)
