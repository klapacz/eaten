import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import { mealSchema } from '@/schemas/meal'
import {
  updateMealServer,
  createMealServer,
  removeMealServer,
} from '@/data/meal'

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
