import { Temporal } from 'temporal-polyfill'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute } from '@tanstack/react-router'
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
import {
  TanstackForm,
  useAppForm,
  withFieldGroup,
} from '@/integrations/tanstack-form'
import {
  CalendarDateTime,
  getLocalTimeZone,
  parseDateTime,
  Time,
  toCalendarDateTime,
  today,
} from '@internationalized/date'
import { useMemo } from 'react'
import { Select } from '@/components/ui/select'
import { fieldStyles } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import {
  Meal,
  mealSchema,
  mealTypeSchema,
  mealTypeToDisplayText,
} from '@/schemas/meal'

export const Route = createFileRoute('/')({
  component: App,
  ssr: false,
  validateSearch: z.union([
    z.object({
      meal: z.uuid().optional(),
      add: z.undefined().optional(),
    }),
    z.object({
      meal: z.undefined().optional(),
      add: z.literal(true),
    }),
  ]),
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
        <Button
          onPress={() => navigate({ search: { add: true } })}
          intent="secondary"
        >
          Create meal
        </Button>
      </div>

      <Sheet
        isOpen={search.add !== undefined}
        onOpenChange={() => navigate({ search: { meal: undefined } })}
      >
        <Sheet.Content>
          <CreateMealSheetContent />
        </Sheet.Content>
      </Sheet>

      <Sheet
        isOpen={search.meal !== undefined}
        onOpenChange={() => navigate({ search: { add: undefined } })}
      >
        <Sheet.Content>
          {selectedMeal.data ? (
            <UpdateMealSheetContent meal={selectedMeal.data} />
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

function CreateMealSheetContent() {
  const navigate = Route.useNavigate()
  const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
    () => ({
      id: crypto.randomUUID(),
      datetime: toCalendarDateTime(today(getLocalTimeZone()), new Time(12, 0)),
      type: 'BREAKFAST',
      items: [],
    }),
    [],
  )

  const form = useAppForm({
    validators: {
      onSubmit: mealFormSchema,
    },
    defaultValues,
    async onSubmit({ value, formApi }) {
      const tx = mealCollection.insert({
        ...value,
        datetime: value.datetime.toString(),
      })
      await tx.isPersisted.promise
      formApi.reset()
      await navigate({ search: { meal: undefined } })
    },
  })

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>Create Meal</Sheet.Title>
      </Sheet.Header>
      <TanstackForm form={form} AppForm={form.AppForm}>
        <Sheet.Body className="grid gap-4">
          <form.ServerErrorNote />

          <FieldGroupMeal
            form={form}
            fields={{
              id: 'id',
              datetime: 'datetime',
              type: 'type',
              items: 'items',
            }}
          />

          <Separator />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton>Create</form.SubscribeButton>
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}

function UpdateMealSheetContent({ meal }: { meal: Meal }) {
  const navigate = Route.useNavigate()
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
    async onSubmit({ value, formApi }) {
      const tx = mealCollection.update(meal.id, (draft) => {
        draft.datetime = value.datetime.toString()
        draft.items = value.items.filter((item) => item.trim() !== '')
        draft.type = value.type
      })
      await tx.isPersisted.promise
      formApi.reset()
      await navigate({ search: { meal: undefined } })
    },
  })

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>Meal</Sheet.Title>
      </Sheet.Header>
      <TanstackForm form={form} AppForm={form.AppForm}>
        <Sheet.Body className="grid gap-4">
          <form.ServerErrorNote />

          <FieldGroupMeal
            form={form}
            fields={{
              id: 'id',
              datetime: 'datetime',
              type: 'type',
              items: 'items',
            }}
          />

          <Separator />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton />
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}

const { label } = fieldStyles()

const mealFormSchema = mealSchema.extend({
  datetime: z.instanceof(CalendarDateTime),
})

const FieldGroupMeal = withFieldGroup({
  defaultValues: {} as z.infer<typeof mealFormSchema>,
  render: function Render({ group }) {
    return (
      <>
        <group.AppField name="datetime">
          {(field) => <field.DatePicker label="Date and Time" />}
        </group.AppField>

        <group.AppField name="type">
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
        </group.AppField>

        <group.Field name="items" mode="array">
          {(field) => {
            return (
              <div className="flex flex-col gap-y-1">
                <h3 className={label()}>Items</h3>
                {field.state.value.map((_, i) => {
                  return (
                    <group.AppField key={i} name={`items[${i}]`}>
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
                    </group.AppField>
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
        </group.Field>
      </>
    )
  },
})
