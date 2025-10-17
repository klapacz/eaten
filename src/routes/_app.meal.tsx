import { Temporal } from 'temporal-polyfill'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import { IconDotsVertical } from '@intentui/icons'
import { mealTypeToDisplayText } from '@/schemas/meal'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { CreateMealButtonGroup, MealActionsMenu } from './-shared'
import AppSidebarNav from './-app-sidebar-nav'

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
      <PageSidebarNav />

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

export default function PageSidebarNav() {
  return (
    <AppSidebarNav>
      <Breadcrumbs>
        <Breadcrumbs.Item>Meals</Breadcrumbs.Item>
      </Breadcrumbs>

      <CreateMealButtonGroup
        createMealLinkOptions={{ to: '/meal/add', search: true }}
        updateMealNavigateOptions={({ mealId }) => ({
          to: '/meal/$mealId',
          params: { mealId },
        })}
      />
    </AppSidebarNav>
  )
}

const TableRowLink = createLink(Table.Row)
