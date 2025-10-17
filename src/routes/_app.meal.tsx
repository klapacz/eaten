import { Temporal } from 'temporal-polyfill'
import { Button, buttonStyles } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import { IconDotsVertical, IconVoice } from '@intentui/icons'
import { VoiceRecorder } from './-voice-recorder'
import { mealTypeToDisplayText } from '@/schemas/meal'
import { Link } from '@/components/ui/link'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SidebarNav, SidebarTrigger } from '@/components/ui/sidebar'
import { MealActionsMenu } from './-shared'

export const Route = createFileRoute('/_app/meal')({
  component: App,
})

function App() {
  const meals = useLiveQuery((q) =>
    q
      .from({ meal: mealCollection })
      .orderBy(({ meal }) => meal.datetime, 'desc'),
  )

  return (
    <div className="[--gutter:--spacing(4)]">
      <AppSidebarNav />

      <Outlet />

      <div className="p-(--gutter)">
        <Table aria-label="Meals" bleed>
          <Table.Header>
            <Table.Column isRowHeader>Date</Table.Column>
            <Table.Column>Time</Table.Column>
            <Table.Column>Type</Table.Column>
            <Table.Column>Items</Table.Column>
            <Table.Column />
          </Table.Header>
          <Table.Body items={meals.data}>
            {(meal) => {
              const dt = Temporal.PlainDateTime.from(meal.datetime)
              return (
                <TableRowLink to="/meal/$mealId" params={{ mealId: meal.id }}>
                  <Table.Cell>
                    {dt.toLocaleString(undefined, {
                      dateStyle: 'short',
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    {dt.toLocaleString(undefined, {
                      timeStyle: 'short',
                    })}
                  </Table.Cell>
                  <Table.Cell>{mealTypeToDisplayText[meal.type]}</Table.Cell>
                  <Table.Cell>{meal.items.join(', ')}</Table.Cell>
                  <Table.Cell className="text-end last:pr-2.5">
                    <MealActionsMenu meal={meal}>
                      <IconDotsVertical className="touch-target" />
                    </MealActionsMenu>
                  </Table.Cell>
                </TableRowLink>
              )
            }}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export default function AppSidebarNav() {
  const navigate = Route.useNavigate()
  return (
    <SidebarNav>
      <span className="flex items-center gap-x-4">
        <SidebarTrigger className="-ml-2" />
        <Breadcrumbs className="hidden md:flex">
          <Breadcrumbs.Item href="/">Dashboard</Breadcrumbs.Item>
          <Breadcrumbs.Item>Meals</Breadcrumbs.Item>
        </Breadcrumbs>
      </span>

      <div className="flex gap-2">
        <VoiceRecorder
          onOpen={({ mealId }) => {
            void navigate({ to: '/meal/$mealId', params: { mealId } })
          }}
        >
          <Button size="sq-md" isCircle>
            <IconVoice />
          </Button>
        </VoiceRecorder>
        <Link to="/meal/add" className={buttonStyles({ intent: 'secondary' })}>
          Create meal
        </Link>
      </div>
    </SidebarNav>
  )
}

const TableRowLink = createLink(Table.Row)
