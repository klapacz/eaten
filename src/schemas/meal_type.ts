import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'
import z from 'zod'

export const mealTypeSchema = z.object({
  id: z.uuid(),
  default_time: z.iso.time(),
  name: z.string().min(1),
  consider_time: z.boolean(),
  color: z.custom<MealTypeColorUtils.ColorName>((v) => typeof v === 'string'),
})

export type MealType = z.infer<typeof mealTypeSchema>
