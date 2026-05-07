import { MealWithType } from '@/db-collections'
import { Temporal } from 'temporal-polyfill'

export function formatWeekMealsForClipboard({
  weekStart,
  meals,
}: {
  weekStart: Temporal.PlainDate
  meals: MealWithType[]
}) {
  const mealsByDate = new Map<string, MealWithType[]>()

  for (const meal of meals) {
    const dateKey = Temporal.PlainDateTime.from(meal.datetime)
      .toPlainDate()
      .toString()

    mealsByDate.set(dateKey, [...(mealsByDate.get(dateKey) ?? []), meal])
  }

  const days = Array.from({ length: 7 }, (_, index) =>
    weekStart.add({ days: index }),
  )

  return days
    .map((day) => {
      const heading = `# ${formatClipboardDayHeading(day)}`
      const dayMeals = mealsByDate.get(day.toString()) ?? []

      if (dayMeals.length === 0) return heading

      return [heading, ...dayMeals.map(formatMealLineForClipboard)].join('\n')
    })
    .join('\n\n')
}

function formatClipboardDayHeading(date: Temporal.PlainDate) {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatMealLineForClipboard(meal: MealWithType) {
  const datetime = Temporal.PlainDateTime.from(meal.datetime)

  const timePrefix = meal.type_consider_time
    ? `${datetime.toLocaleString(undefined, { timeStyle: 'short' })} `
    : ''

  const items = meal.items.join(', ')

  return `- ${timePrefix}${meal.type_name}: ${items}`
}
