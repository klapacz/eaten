import { mealTypeCollection } from './index'
import { Encoder } from '@/lib/encoder'
import { createUpdater } from '@/lib/tanstack-db'
import z from 'zod'
import { mealTypeSchema } from '@/schemas/meal_type'
import { Temporal } from 'temporal-polyfill'
import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'

export namespace MealTypeRepo {
  export type StoredRecord = z.infer<typeof mealTypeSchema>

  export type Record = {
    id: string
    name: string
    default_time: Temporal.PlainTime
    consider_time: boolean
    color: MealTypeColorUtils.ColorName
  }

  export const encoder: Encoder<StoredRecord, Record> = {
    decode: (value) => ({
      ...value,
      default_time: Temporal.PlainTime.from(value.default_time),
    }),
    encode: (value) => ({
      ...value,
      default_time: value.default_time.toString(),
    }),
  }

  const updater = createUpdater({ encoder })

  export function get(id: string) {
    const mealType = mealTypeCollection.get(id)
    if (!mealType) throw new Error(`MealType with id ${id} not found`)

    return encoder.decode(mealType)
  }

  type InsertRecord = Omit<Record, 'id'>

  export function insert(record: InsertRecord | InsertRecord[]) {
    const records = Array.isArray(record) ? record : [record]

    return mealTypeCollection.insert(
      records.map((mealType) =>
        encoder.encode({
          ...mealType,
          id: crypto.randomUUID(),
        }),
      ),
    )
  }

  export function update(id: string, mealType: Record) {
    return mealTypeCollection.update(
      id,
      updater(() => mealType),
    )
  }

  export function remove(id: string) {
    return mealTypeCollection.delete(id)
  }

  export function duplicate(id: string) {
    const mealType = get(id)
    return insert(mealType)
  }
}
