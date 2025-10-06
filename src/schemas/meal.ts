import z from 'zod'

export const mealTypeSchema = z.enum([
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

export const mealSchema = z.object({
  id: z.uuid(),
  type: mealTypeSchema,
  items: z.array(z.string()),
  datetime: z.string(),
})

export type Meal = z.infer<typeof mealSchema>
