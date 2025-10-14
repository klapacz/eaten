import {
  GridList,
  GridListEmptyState,
  GridListItem,
} from '@/components/ui/grid-list'
import { mealCollection } from '@/db-collections'
import { cn } from '@/lib/utils'
import { Meal, mealTypeToDisplayText } from '@/schemas/meal'
import { like, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  GridListItemProps,
  isTextDropItem,
  useDragAndDrop,
} from 'react-aria-components'
import { Temporal } from 'temporal-polyfill'
import { Interval, startOfWeek } from 'vremel'
import { VoiceRecorder } from './-voice-recorder'
import { Button, buttonStyles } from '@/components/ui/button'
import { IconVoice } from '@intentui/icons'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/calendar')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const days: DayType[] = useMemo(() => {
    const today = Temporal.Now.plainDateISO()
    const weekStart = startOfWeek(today, { firstDayOfWeek: 1 })
    const weekInterval = {
      start: weekStart,
      end: weekStart.add({ weeks: 1 }),
    }

    const days = getDaysInInterval(weekInterval).map((day) => ({
      date: day,
      isToday: day.equals(today),
    }))

    return days
  }, [])

  return (
    <div>
      <div className="flex gap-2">
        <VoiceRecorder
          onOpen={({ mealId }) => {
            void navigate({ to: '/calendar/$mealId', params: { mealId } })
          }}
        >
          <Button size="sq-md" isCircle>
            <IconVoice />
          </Button>
        </VoiceRecorder>
        <Link
          to="/calendar/add"
          className={buttonStyles({ intent: 'secondary' })}
        >
          Create meal
        </Link>
      </div>

      <Outlet />

      <div className="grid auto-cols-[200px] grid-flow-col gap-2 overflow-x-auto divide-x">
        {days.map((day) => (
          <Day day={day} key={day.date.toString()} />
        ))}
      </div>
    </div>
  )
}

type DayType = {
  date: Temporal.PlainDate
  isToday: boolean
}

function Day({ day }: { day: DayType }) {
  const meals = useLiveQuery((q) =>
    q
      .from({ meal: mealCollection })
      .where(({ meal }) => like(meal.datetime, `${day.date.toString()}%`))
      .orderBy(({ meal }) => meal.datetime, 'asc'),
  )

  const { dragAndDropHooks } = useDragAndDrop<Meal>({
    // Accept drops with the custom format.
    acceptedDragTypes: ['custom-app-type'],

    // Ensure items are always moved rather than copied.
    getDropOperation: () => 'move',

    getItems(_keys, items) {
      return items.map((item) => {
        return {
          'custom-app-type': item.id,
        }
      })
    },

    async onInsert(e) {
      const processedItems = await Promise.all(
        e.items
          .filter(isTextDropItem)
          .map(async (item) => await item.getText('custom-app-type')),
      )
      mealCollection.update(processedItems, (drafts) => {
        drafts.forEach((draft) => {
          const time = Temporal.PlainDateTime.from(draft.datetime).toPlainTime()
          draft.datetime = day.date
            .toPlainDateTime(time)
            .toString()
            .replace('T', ' ')
        })
      })
    },

    async onRootDrop(e) {
      const processedItems = await Promise.all(
        e.items
          .filter(isTextDropItem)
          .map(async (item) => await item.getText('custom-app-type')),
      )
      mealCollection.update(processedItems, (drafts) => {
        drafts.forEach((draft) => {
          const time = Temporal.PlainDateTime.from(draft.datetime).toPlainTime()
          draft.datetime = day.date.toPlainDateTime(time).toString()
        })
      })
    },
  })

  return (
    <div>
      <div className={cn('p-2 text-center', !day.isToday && 'text-muted-fg')}>
        {day.date.toLocaleString('en-US', {
          weekday: 'short',
          day: 'numeric',
        })}
      </div>

      <GridList
        aria-label={`Meal List ${day.date.toLocaleString('en-US', { weekday: 'long' })}`}
        className="flex flex-col gap-2 p-2"
        items={meals.data}
        dragAndDropHooks={dragAndDropHooks}
        renderEmptyState={() => (
          <GridListEmptyState className="text-center text-muted-fg text-sm">
            No meals
          </GridListEmptyState>
        )}
      >
        {(item) => <MealCard key={item.id} meal={item} />}
      </GridList>
    </div>
  )
}

function MealCard({ meal, ...props }: { meal: Meal } & GridListItemProps) {
  const date = Temporal.PlainDateTime.from(meal.datetime)
  return (
    <GridListItemLink
      from={Route.fullPath}
      to="/calendar/$mealId"
      params={{ mealId: meal.id }}
      className="p-2 flex-col gap-2 bg-white"
      aria-label={`Meal ${meal.id}`}
      textValue={`Meal ${meal.id}`}
      key={meal.id}
      {...props}
    >
      <ul className="list-disc pl-4 text-sm">
        {meal.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="text-muted-fg text-sm flex gap-1">
        <div>{mealTypeToDisplayText[meal.type]}</div> ·
        <div>{date.toLocaleString('en-US', { timeStyle: 'short' })}</div>
      </div>
    </GridListItemLink>
  )
}

const GridListItemLink = createLink(GridListItem)

function getDaysInInterval(interval: Interval<Temporal.PlainDate>) {
  const days = []
  for (
    let date = interval.start;
    Temporal.PlainDate.compare(date, interval.end) < 0;
    date = date.add({ days: 1 })
  ) {
    days.push(date)
  }
  return days
}
