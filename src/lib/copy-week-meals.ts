import { mealCollection, mealTypeCollection } from '@/db-collections'
import { formatWeekMealsForClipboard } from '@/lib/meal-week-clipboard'
import { plainDateTimeEncoder } from '@/lib/temporal'
import {
  and,
  createLiveQueryCollection,
  eq,
  gte,
  lt,
} from '@tanstack/react-db'
import { Temporal } from 'temporal-polyfill'

export async function copyWeekMeals(weekStart: Temporal.PlainDate) {
  const meals = await getWeekMeals(weekStart)

  const text = formatWeekMealsForClipboard({
    weekStart,
    meals,
  })

  await navigator.clipboard.writeText(text)
}

async function getWeekMeals(weekStart: Temporal.PlainDate) {
  const weekEnd = weekStart.add({ weeks: 1 })

  const startDateTime = plainDateTimeEncoder.encode(
    weekStart.toPlainDateTime('00:00'),
  )
  const endDateTime = plainDateTimeEncoder.encode(
    weekEnd.toPlainDateTime('00:00'),
  )

  const weekMealsCollection = createLiveQueryCollection({
    query: (q) =>
      q
        .from({ meal: mealCollection })
        .where(({ meal }) =>
          and(
            gte(meal.datetime, startDateTime),
            lt(meal.datetime, endDateTime),
          ),
        )
        .innerJoin({ type: mealTypeCollection }, ({ meal, type }) =>
          eq(meal.meal_type_id, type.id),
        )
        .orderBy(({ type }) => type.consider_time, 'desc')
        .orderBy(({ meal }) => meal.datetime, 'asc')
        .select(({ meal, type }) => ({
          id: meal.id,
          items: meal.items,
          datetime: meal.datetime,
          type_name: type.name,
          type_consider_time: type.consider_time,
          type_color: type.color,
        })),
  })

  try {
    return (await weekMealsCollection.toArrayWhenReady())
  } finally {
    await weekMealsCollection.cleanup()
  }
}
