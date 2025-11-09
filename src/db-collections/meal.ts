import { plainDateTimeEncoder } from '@/lib/temporal'
import { mealCollection } from './index'
import { Temporal } from 'temporal-polyfill'
import { Encoder } from '@/lib/encoder'
import { createUpdater } from '@/lib/tanstack-db'
import z from 'zod'
import { mealSchema } from '@/schemas/meal'

export namespace MealRepo {
  export type StoredRecord = z.infer<typeof mealSchema>

  export type Record = {
    id: string
    meal_type_id: string
    items: string[]
    datetime: Temporal.PlainDateTime
  }

  export const encoder: Encoder<StoredRecord, Record> = {
    decode: (value) => ({
      ...value,
      datetime: plainDateTimeEncoder.decode(value.datetime),
    }),
    encode: (value) => ({
      ...value,
      items: value.items.filter((item) => item.trim() !== ''),
      datetime: plainDateTimeEncoder.encode(value.datetime),
    }),
  }

  const updater = createUpdater({ encoder })

  export function get(id: string) {
    const meal = mealCollection.get(id)
    if (!meal) throw new Error(`Meal with id ${id} not found`)

    return encoder.decode(meal)
  }

  type InsertRecord = Omit<Record, 'id'>

  export function insert(record: InsertRecord | InsertRecord[]) {
    const records = Array.isArray(record) ? record : [record]

    return mealCollection.insert(
      records.map((meal) =>
        encoder.encode({
          ...meal,
          id: crypto.randomUUID(),
        }),
      ),
    )
  }

  export function update(id: string, meal: Record) {
    return mealCollection.update(
      id,
      updater(() => meal),
    )
  }

  export function remove(id: string) {
    return mealCollection.delete(id)
  }

  export function duplicate(id: string) {
    const meal = get(id)
    return insert(meal)
  }

  /** Copy meals to a new date while preserving their time. */
  export function copyManyToDate(
    mealIds: string[],
    targetDate: Temporal.PlainDate,
  ) {
    const newMeals = mealIds.map((id) => {
      const meal = get(id)
      const datetime = targetDate.toPlainDateTime(meal.datetime.toPlainTime())

      return { ...meal, datetime }
    })

    return insert(newMeals)
  }

  /** Move meals to a new date while preserving their time. */
  export function moveManyToDate(
    mealIds: string[],
    targetDate: Temporal.PlainDate,
  ) {
    return mealCollection.update(
      mealIds,
      updater((meal) => {
        const datetime = targetDate.toPlainDateTime(meal.datetime.toPlainTime())

        return { ...meal, datetime }
      }),
    )
  }
}
