import { Temporal } from 'temporal-polyfill'
import { Button, buttonStyles } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, createLink } from '@tanstack/react-router'
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
import { Sheet } from '@/components/ui/sheet'
import { mealTypeToDisplayText } from '@/schemas/meal'
import {
  CreateMealSheetContent,
  UpdateMealSheetContent,
  validateSearch,
} from './-shared'
import { Link } from 'react-aria-components'

export const Route = createFileRoute('/')({
  component: App,
  ssr: false,
  validateSearch: validateSearch,
})

const TanstackLink = createLink(Link)

function App() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const meals = useLiveQuery((q) =>
    q
      .from({ meal: mealCollection })
      .orderBy(({ meal }) => meal.datetime, 'desc'),
  )
  const selectedMeal = useLiveQuery(
    (q) =>
      q
        .from({ meal: mealCollection })
        .where(({ meal }) => eq(meal.id, search.meal))
        .findOne(),
    [search.meal],
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
        <TanstackLink
          from={Route.fullPath}
          search={{ add: true }}
          className={buttonStyles({ intent: 'secondary' })}
        >
          Create meal
        </TanstackLink>
      </div>

      <Sheet
        isOpen={search.add !== undefined}
        onOpenChange={() => navigate({ search: { meal: undefined } })}
      >
        <Sheet.Content>
          {({ close }) => <CreateMealSheetContent close={close} />}
        </Sheet.Content>
      </Sheet>

      <Sheet
        isOpen={search.meal !== undefined}
        onOpenChange={() => navigate({ search: { add: undefined } })}
      >
        <Sheet.Content>
          {({ close }) =>
            selectedMeal.data ? (
              <UpdateMealSheetContent meal={selectedMeal.data} close={close} />
            ) : null
          }
        </Sheet.Content>
      </Sheet>

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
              <TableRowLink from={Route.fullPath} search={{ meal: item.id }}>
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
                      <MenuItem
                        isDanger
                        onAction={() => mealCollection.delete(item.id)}
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
