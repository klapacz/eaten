import z from 'zod'

export const mealSchema = z.object({
  id: z.uuid(),
  meal_type_id: z.uuid(),
  items: z.array(z.string()),
  datetime: z.string(),
})

export type Meal = z.infer<typeof mealSchema>
