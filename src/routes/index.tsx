import { Temporal } from 'temporal-polyfill'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { mealCollection, mealTypeToDisplayText } from '@/db-collections'
import { db } from '@/db/client'
import { mealTable } from '@/db/schema'
import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
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

const addMealServer = createServerFn({ method: 'POST' }).handler(async () => {
  await db
    .insert(mealTable)
    .values({
      type: 'BRUNCH',
      datetime: Temporal.PlainDateTime.from({
        year: 2025,
        month: 10,
        day: 5,
      }).toString(),
    })
    .execute()
})

export const Route = createFileRoute('/')({
  component: App,
  ssr: false,
})

function App() {
  const meals = useLiveQuery((q) =>
    q
      .from({ meal: mealCollection })
      .orderBy(({ meal }) => meal.datetime, 'desc'),
  )
  const addMeal = useServerFn(addMealServer)
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
        <Button onPress={() => addMeal()} intent="secondary">
          Add meal
        </Button>
      </div>

      <Table aria-label="Meals">
        <Table.Header>
          <Table.Column isRowHeader>Date</Table.Column>
          <Table.Column>Time</Table.Column>
          <Table.Column>Type</Table.Column>
          <Table.Column>Items</Table.Column>
          <Table.Column />
        </Table.Header>
        <Table.Body items={meals.data}>
          {(item) => {
            const dt = Temporal.PlainDateTime.from(item.datetime)
            return (
              <Table.Row>
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
                <Table.Cell>{mealTypeToDisplayText[item.type]}</Table.Cell>
                <Table.Cell>{item.items.join(', ')}</Table.Cell>
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
                      <MenuItem isDanger>
                        <IconTrash /> Delete
                      </MenuItem>
                    </MenuContent>
                  </Menu>
                </Table.Cell>
              </Table.Row>
            )
          }}
        </Table.Body>
      </Table>
    </div>
  )
}
