import { GridList, GridListEmptyState } from '@/components/ui/grid-list'
import { mealCollection } from '@/db-collections'
import { cn } from '@/lib/utils'
import { Meal, mealTypeToDisplayText } from '@/schemas/meal'
import { like, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import {
  Button as ButtonPrimitive,
  GridListItemProps,
  GridListItem as GridListItemPrimitive,
  isTextDropItem,
  useDragAndDrop,
} from 'react-aria-components'
import { Temporal } from 'temporal-polyfill'
import { Interval, startOfWeek } from 'vremel'
import { VoiceRecorder } from './-voice-recorder'
import { Button, buttonStyles } from '@/components/ui/button'
import { IconChevronLeft, IconChevronRight, IconVoice } from '@intentui/icons'
import { Link } from '@/components/ui/link'
import { twMerge } from 'tailwind-merge'
import { DragIcon } from '@/components/ui/drag-icon'
import z from 'zod'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { SidebarNav, SidebarTrigger } from '@/components/ui/sidebar'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const today = Temporal.Now.plainDateISO()
const todayISO = today.toString()

export const Route = createFileRoute('/_app/calendar')({
  component: RouteComponent,
  validateSearch: z.object({
    date: z.iso.date().optional().default(todayISO),
  }),
  loaderDeps: ({ search: { date } }) => ({ dateISO: date }),
  async loader({ deps: { dateISO } }) {
    const day = Temporal.PlainDate.from(dateISO)
    const weekStart = startOfWeek(day, { firstDayOfWeek: 1 })
    const nextWeek = weekStart.add({ weeks: 1 })
    const weekInterval = {
      start: weekStart,
      end: nextWeek,
    }

    const days = getDaysInInterval(weekInterval).map((day) => ({
      date: day,
      isToday: today.equals(day),
    }))

    const prevWeek = weekStart.subtract({ weeks: 1 })
    return { days, nextWeek, prevWeek }
  },
})

function RouteComponent() {
  const { days, prevWeek, nextWeek } = Route.useLoaderData()

  return (
    <div className="flex-1 flex flex-col [--gutter:--spacing(4)]">
      <Nav prevWeek={prevWeek} nextWeek={nextWeek} />
      <Outlet />

      <div className="p-(--gutter) flex-1 flex flex-col">
        <div className="grid auto-cols-[minmax(200px,1fr)] grid-flow-col overflow-x-auto -mx-(--gutter) px-(--gutter) flex-1">
          {days.map((day) => (
            <Day day={day} key={day.date.toString()} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Nav({
  prevWeek,
  nextWeek,
}: {
  prevWeek: Temporal.PlainDate
  nextWeek: Temporal.PlainDate
}) {
  const navigate = Route.useNavigate()
  return (
    <SidebarNav>
      <span className="flex items-center gap-x-4">
        <SidebarTrigger className="-ml-2" />
        <Breadcrumbs className="hidden md:flex">
          <Breadcrumbs.Item href="/">Dashboard</Breadcrumbs.Item>
          <Breadcrumbs.Item>Meals</Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <Link
              from={Route.fullPath}
              search={{ date: prevWeek.toString() }}
              className={buttonStyles({
                intent: 'secondary',
                isCircle: true,
              })}
            >
              <IconChevronLeft />
              <VisuallyHidden>Previous Week</VisuallyHidden>
            </Link>
            <Link
              from={Route.fullPath}
              search={{ date: nextWeek.toString() }}
              className={buttonStyles({
                intent: 'secondary',
                isCircle: true,
              })}
            >
              <IconChevronRight />
              <VisuallyHidden>Next Week</VisuallyHidden>
            </Link>
          </div>
          <div className="flex gap-2">
            <Link
              to="/calendar/add"
              search
              className={buttonStyles({ intent: 'secondary' })}
            >
              Create
            </Link>
            <VoiceRecorder
              onOpen={({ mealId }) => {
                void navigate({ to: '/calendar/$mealId', params: { mealId } })
              }}
            >
              <Button size="sq-md" isCircle>
                <IconVoice />
              </Button>
            </VoiceRecorder>
          </div>
        </div>
      </span>
    </SidebarNav>
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
    <div className="flex flex-col group">
      <div
        className={cn(
          'p-2 text-center group-first:pl-0 group-last:pr-0 border-b border-border/50',
          !day.isToday && 'text-muted-fg',
        )}
      >
        {day.date.toLocaleString('en-US', {
          weekday: 'short',
          day: 'numeric',
        })}
      </div>

      <GridList
        aria-label={`Meal List ${day.date.toLocaleString('en-US', { weekday: 'long' })}`}
        className="flex flex-1 flex-col gap-2 p-2 group-first:pl-0 group-last:pr-0 group-not-last:border-r border-border/50"
        items={meals.data}
        dragAndDropHooks={dragAndDropHooks}
        renderEmptyState={() => (
          <GridListEmptyState className="text-center text-muted-fg text-sm ">
            No meals
          </GridListEmptyState>
        )}
      >
        {(item) => <MealCard key={item.id} meal={item} />}
      </GridList>
    </div>
  )
}

const GridListItemLink = createLink(GridListItemPrimitive)

function MealCard({ meal, ...props }: { meal: Meal } & GridListItemProps) {
  const date = Temporal.PlainDateTime.from(meal.datetime)
  return (
    <GridListItemLink
      className={twMerge([
        'relative min-w-0 outline-hidden',
        'border rounded-lg',
        'p-2 flex flex-col gap-2 bg-white',
        'dragging:cursor-grab dragging:opacity-70 dragging:**:[[slot=drag]]:text-(--grid-list-item-text-active)',
        'hover:bg-accent focus focus-visible:bg-accent selected:bg-accent',
      ])}
      to="/calendar/$mealId"
      params={{ mealId: meal.id }}
      search
      aria-label={`Meal ${meal.type}`}
      textValue={`Meal ${meal.type}`}
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
        <ButtonPrimitive slot="drag" className="ml-auto">
          <DragIcon />
        </ButtonPrimitive>
      </div>
    </GridListItemLink>
  )
}

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
