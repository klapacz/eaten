import { createServerFn } from '@tanstack/react-start'
import { DB } from '@/db/client'
import { mealTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { generateTxId } from '@/db/tx'
import { mealSchema } from '@/schemas/meal'
import z from 'zod'
import { AuthContext } from '@/auth/server'
import { env } from 'cloudflare:workers'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { createInsertSchema } from 'drizzle-zod'
import {
  getUserMealTypeById,
  getUserMealTypeByName,
  listUserMealTypes,
} from './meal_type.repo'

export const updateMealServer = createServerFn({ method: 'POST' })
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

export const createMealServer = createServerFn({ method: 'POST' })
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

export const removeMealServer = createServerFn({ method: 'POST' })
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

const transcribeServerFormDataSchema = z.object({
  audio: z.file(),
  today: z.iso.date(),
})

export const transcribeServer = createServerFn({ method: 'POST' })
  .inputValidator(z.instanceof(FormData))
  .handler(async ({ data: _data }) => {
    const session = await AuthContext.getSession()
    const data = transcribeServerFormDataSchema.parse(
      Object.fromEntries(_data.entries()),
    )

    const aBuffer = await data.audio.arrayBuffer()
    const base64String = Buffer.from(aBuffer).toString('base64')

    const results = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: base64String,
    })

    const transcript = results.text
    console.log({ transcript })

    const schema = createInsertSchema(mealTable).omit({
      id: true,
      userId: true,
    })

    const { object } = await generateObject({
      model: google('gemini-2.5-pro'),
      schema,
      prompt: `Extract meal information from this voice transcript: "${transcript}"

Current date: ${data.today}

Instructions:
- Parse the meal name/description from what the user said
- If the user mentions a specific date or time (e.g., "yesterday", "this morning", "at 3pm"), calculate the appropriate datetime relative to ${data.today}
- Extract any mentioned nutritional information or details
- Be flexible with informal language (e.g., "I had pizza" → meal name: "pizza")`,
    })

    console.log({ object })

    const [insertedMeal] = await DB.use((db) =>
      db
        .insert(mealTable)
        .values({ ...object, userId: session.user.id })
        .returning()
        .execute(),
    )

    console.log({ insertedMeal })

    return insertedMeal
  })
