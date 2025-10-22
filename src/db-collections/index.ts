import {
  createCollection,
  eq,
  liveQueryCollectionOptions,
} from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { mealSchema } from '@/schemas/meal'
import {
  updateMealServer,
  createMealServer,
  removeMealServer,
} from '@/data/meal'
import { mealTypeSchema } from '@/schemas/meal_type'
import {
  updateMealTypeServer,
  createMealTypeServer,
  removeMealTypeServer,
} from '@/data/meal_type'
import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'

export const mealCollection = createCollection(
  electricCollectionOptions({
    id: 'meal_collection',
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

export const mealTypeCollection = createCollection(
  electricCollectionOptions({
    id: 'meal_type_collection',
    shapeOptions: {
      url:
        typeof window !== 'undefined'
          ? new URL('/api/sync/meal_type', window.location.origin).toString()
          : '',
    },

    schema: mealTypeSchema,
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const originalMealType = transaction.mutations[0].original
      const modifiedMealType = transaction.mutations[0].modified
      const response = await updateMealTypeServer({
        data: { ...modifiedMealType, id: originalMealType.id },
      })

      return { txid: response.txid }
    },
    onInsert: async ({ transaction }) => {
      const newMealType = transaction.mutations[0].modified
      const response = await createMealTypeServer({ data: newMealType })

      return { txid: response.txid }
    },
    onDelete: async ({ transaction }) => {
      const deletedMealType = transaction.mutations[0].original
      const response = await removeMealTypeServer({ data: deletedMealType })

      return { txid: response.txid }
    },
  }),
)

export const mealWithTypeCollection = createCollection(
  liveQueryCollectionOptions({
    id: 'meal_with_type_collection',
    query: (q) =>
      q
        .from({ meal: mealCollection })
        .innerJoin({ type: mealTypeCollection }, ({ meal, type }) =>
          eq(meal.meal_type_id, type.id),
        )
        .select(({ meal, type }) => ({
          id: meal.id,
          items: meal.items,
          datetime: meal.datetime,
          type_name: type.name,
          type_consider_time: type.consider_time,
          type_color: type.color,
        })),
  }),
)

export type MealWithType = {
  id: string
  items: string[]
  datetime: string
  type_name: string
  type_consider_time: boolean
  type_color: MealTypeColorUtils.ColorName
}
