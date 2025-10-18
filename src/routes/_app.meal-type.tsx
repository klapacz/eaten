import { Table } from '@/components/ui/table'
import { mealTypeCollection } from '@/db-collections'
import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import { IconDotsVertical, IconPlus } from '@intentui/icons'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import AppSidebarNav from './-app-sidebar-nav'
import { Link } from '@/components/ui/link'
import { buttonStyles } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MealTypeActionsMenu } from './-meal-type-shared'
import { Temporal } from 'temporal-polyfill'
import { MenuTrigger } from '@/components/ui/menu'

export const Route = createFileRoute('/_app/meal-type')({
  component: App,
})

function App() {
  const { data: mealTypes } = useLiveQuery((q) =>
    q
      .from({ type: mealTypeCollection })
      .orderBy(({ type }) => type.consider_time, 'asc')
      .orderBy(({ type }) => type.default_time, 'asc'),
  )

  return (
    <div className="[--gutter:--spacing(4)]">
      <PageSidebarNav />

      <Outlet />

      <div className="p-(--gutter)">
        <Table aria-label="Meal Types" bleed>
          <Table.Header>
            <Table.Column isRowHeader>Name</Table.Column>
            <Table.Column>Consider Time</Table.Column>
            <Table.Column className="items-end">
              <span className="ml-auto">Default Time</span>
            </Table.Column>
            <Table.Column />
          </Table.Header>
          <Table.Body items={mealTypes}>
            {(mealType) => {
              const time = Temporal.PlainTime.from(mealType.default_time)
              return (
                <TableRowLink
                  to="/meal-type/$mealTypeId"
                  params={{ mealTypeId: mealType.id }}
                >
                  <Table.Cell>{mealType.name}</Table.Cell>
                  <Table.Cell>
                    {mealType.consider_time ? 'Yes' : 'No'}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {mealType.consider_time
                      ? time.toLocaleString(undefined, {
                          hour: 'numeric',
                          minute: 'numeric',
                        })
                      : '-'}
                  </Table.Cell>
                  <Table.Cell className="text-end last:pr-2.5">
                    <MealTypeActionsMenu meal_type_id={mealType.id}>
                      <MenuTrigger>
                        <IconDotsVertical className="touch-target" />
                      </MenuTrigger>
                    </MealTypeActionsMenu>
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
  const isMobile = useIsMobile()

  return (
    <AppSidebarNav>
      <Breadcrumbs>
        <Breadcrumbs.Item linkOptions={{ to: Route.fullPath }}>
          Meal Types
        </Breadcrumbs.Item>
      </Breadcrumbs>

      <Link
        to="/meal-type/add"
        className={buttonStyles({
          intent: 'secondary',
          size: isMobile ? 'sq-sm' : 'sm',
        })}
      >
        <IconPlus />
        <span className="max-sm:sr-only">Create</span>
      </Link>
    </AppSidebarNav>
  )
}

const TableRowLink = createLink(Table.Row)
