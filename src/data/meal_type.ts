import { createServerFn } from '@tanstack/react-start'
import { DB } from '@/db/client'
import { mealTypeTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { generateTxId } from '@/db/tx'
import { mealTypeSchema } from '@/schemas/meal_type'
import z from 'zod'
import { AuthContext } from '@/auth/server'

export const updateMealTypeServer = createServerFn({ method: 'POST' })
  .inputValidator(mealTypeSchema)
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      const { id, ...rest } = data

      const [mealType] = await DB.use((db) =>
        db
          .select()
          .from(mealTypeTable)
          .where(
            and(
              eq(mealTypeTable.id, id),
              eq(mealTypeTable.userId, session.user.id),
            ),
          ),
      )

      await DB.use((db) =>
        db
          .update(mealTypeTable)
          .set({
            defaultTime: rest.default_time,
            name: rest.name,
            considerTime: rest.consider_time,
            color: rest.color,
          })
          .where(eq(mealTypeTable.id, mealType.id)),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

export const createMealTypeServer = createServerFn({ method: 'POST' })
  .inputValidator(mealTypeSchema)
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      await DB.use((db) =>
        db.insert(mealTypeTable).values({
          id: data.id,
          defaultTime: data.default_time,
          name: data.name,
          considerTime: data.consider_time,
          userId: session.user.id,
        }),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })

export const removeMealTypeServer = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data }) => {
    const session = await AuthContext.getSession()

    return await DB.createTx(async (tx) => {
      await DB.use((db) =>
        db
          .delete(mealTypeTable)
          .where(
            and(
              eq(mealTypeTable.id, data.id),
              eq(mealTypeTable.userId, session.user.id),
            ),
          ),
      )

      const txid = await generateTxId(tx)
      return { txid }
    })
  })
