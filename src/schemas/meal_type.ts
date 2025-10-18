import z from 'zod'

export const mealTypeSchema = z.object({
  id: z.uuid(),
  default_time: z.iso.time(),
  name: z.string().min(1),
  consider_time: z.boolean(),
})

export type MealType = z.infer<typeof mealTypeSchema>
