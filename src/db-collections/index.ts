import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'
import z from 'zod'

const mealTypeSchema = z.enum([
  'BREAKFAST',
  'BRUNCH',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
])

export const mealTypeToDisplayText: Record<
  z.infer<typeof mealTypeSchema>,
  string
> = {
  BREAKFAST: 'Breakfast',
  BRUNCH: 'Brunch',
  LUNCH: 'Lunch',
  AFTERNOON_SNACK: 'Afternoon Snack',
  DINNER: 'Dinner',
}

const mealSchema = z.object({
  id: z.uuid(),
  type: mealTypeSchema,
  items: z.array(z.string()),
  datetime: z.iso.datetime(),
})

export const mealCollection = createCollection(
  electricCollectionOptions({
    shapeOptions: {
      url: 'http://localhost:3000/v1/shape?table=meal&offset=-1',
    },
    schema: mealSchema,
    getKey: (item) => item.id,
  }),
)
