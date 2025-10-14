import { Temporal } from 'temporal-polyfill'
import { Button, buttonStyles } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink, Outlet } from '@tanstack/react-router'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import {
  IconDotsVertical,
  IconEye,
  IconHighlight,
  IconTrash,
  IconVoice,
} from '@intentui/icons'
import {
  useIsTransribeMutationMutating,
  VoiceRecorder,
} from './-voice-recorder'
import { mealTypeToDisplayText } from '@/schemas/meal'
import { Link } from '@/components/ui/link'

export const Route = createFileRoute('/_index')({
  component: App,
})

function App() {
  const meals = useLiveQuery((q) =>
    q
      .from({ meal: mealCollection })
      .orderBy(({ meal }) => meal.datetime, 'desc'),
  )
  const isTransribeMutationMutating = useIsTransribeMutationMutating()

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <div className="flex gap-2">
        <VoiceRecorder>
          <Button
            size="sq-md"
            isCircle
            isDisabled={isTransribeMutationMutating > 0}
          >
            <IconVoice />
          </Button>
        </VoiceRecorder>
        <Link to="/add" className={buttonStyles({ intent: 'secondary' })}>
          Create meal
        </Link>
      </div>

      <Outlet />

      <Table aria-label="Meals">
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
              <TableRowLink to="/$mealId" params={{ mealId: meal.id }}>
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
                  <Menu>
                    <MenuTrigger>
                      <IconDotsVertical />
                    </MenuTrigger>
                    <MenuContent placement="left top">
                      <MenuItem>
                        <IconEye /> View
                      </MenuItem>
                      <MenuItem>
                        <IconHighlight /> Edit
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        isDanger
                        onAction={() => mealCollection.delete(meal.id)}
                      >
                        <IconTrash /> Delete
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </Table.Cell>
              </TableRowLink>
            )
          }}
        </Table.Body>
      </Table>
    </div>
  )
}

const TableRowLink = createLink(Table.Row)
