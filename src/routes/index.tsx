import { Temporal } from 'temporal-polyfill'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import {
  Meal,
  mealCollection,
  mealSchema,
  mealTypeSchema,
  mealTypeToDisplayText,
} from '@/db-collections'
import { db } from '@/db/client'
import { mealTable } from '@/db/schema'
import { eq, useLiveQuery } from '@tanstack/react-db'
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
import z from 'zod'
import { Sheet } from '@/components/ui/sheet'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import { CalendarDateTime, parseDateTime } from '@internationalized/date'
import { useMemo } from 'react'
import { Select } from '@/components/ui/select'
import { fieldStyles } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

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
  validateSearch: z.object({
    meal: z.uuid().optional(),
  }),
})

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

      <Sheet
        isOpen={search.meal !== undefined}
        onOpenChange={() => navigate({ search: { meal: undefined } })}
      >
        <Sheet.Content>
          {selectedMeal.data ? (
            <MealSheetContent meal={selectedMeal.data} />
          ) : null}
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
              <Table.Row
                onAction={() => navigate({ search: { meal: item.id } })}
              >
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

const mealFormSchema = mealSchema.extend({
  datetime: z.instanceof(CalendarDateTime),
})

const { label } = fieldStyles()

function MealSheetContent({ meal }: { meal: Meal }) {
  const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
    () => ({
      ...meal,
      datetime: parseDateTime(meal.datetime.replace(' ', 'T')),
    }),
    [meal],
  )

  const form = useAppForm({
    validators: {
      onSubmit: mealFormSchema,
    },
    defaultValues,
    onSubmit: ({ value }) => {
      console.log({ value })
    },
  })

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>Meal</Sheet.Title>
      </Sheet.Header>
      <TanstackForm form={form} AppForm={form.AppForm}>
        <Sheet.Body className="grid gap-4">
          <form.AppField name="datetime">
            {(field) => <field.DatePicker label="Date and Time" />}
          </form.AppField>

          <form.AppField name="type">
            {(field) => (
              <field.SelectField label="Type">
                <Select.Trigger />
                <Select.Content
                  items={mealTypeSchema.options.map((id) => ({ id }))}
                >
                  {(item) => (
                    <Select.Item
                      id={item.id}
                      textValue={mealTypeToDisplayText[item.id]}
                    >
                      {mealTypeToDisplayText[item.id]}
                    </Select.Item>
                  )}
                </Select.Content>
              </field.SelectField>
            )}
          </form.AppField>

          <form.Field name="items" mode="array">
            {(field) => {
              return (
                <div className="flex flex-col gap-y-1">
                  <h3 className={label()}>Items</h3>
                  {field.state.value.map((_, i) => {
                    return (
                      <form.AppField key={i} name={`items[${i}]`}>
                        {(subField) => {
                          return (
                            <div>
                              <subField.TextField
                                suffix={
                                  <Button
                                    size="sq-xs"
                                    aria-label="New user"
                                    onPress={() => field.removeValue(i)}
                                    intent="plain"
                                  >
                                    <IconTrash />
                                  </Button>
                                }
                              />
                            </div>
                          )
                        }}
                      </form.AppField>
                    )
                  })}
                  <div className="pt-1">
                    <Button
                      onPress={() => field.pushValue('')}
                      intent="secondary"
                      type="button"
                      size="sm"
                    >
                      Add item
                    </Button>
                  </div>
                </div>
              )
            }}
          </form.Field>

          <Separator />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton />
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}
