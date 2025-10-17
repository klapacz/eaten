import { Button } from '@/components/ui/button'
import { mealCollection } from '@/db-collections'
import { IconDuplicate, IconTrash } from '@intentui/icons'
import z from 'zod'
import { Sheet } from '@/components/ui/sheet'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
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

export const validateSearch = z.union([
  z.object({
    meal: z.uuid().optional(),
    add: z.undefined().optional(),
  }),
  z.object({
    meal: z.undefined().optional(),
    add: z.literal(true),
  }),
])

export function CreateMealSheetContent({ close }: { close: () => void }) {
  const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
    () => ({
      id: crypto.randomUUID(),
      datetime: toCalendarDateTime(today(getLocalTimeZone()), new Time(12, 0)),
      type: 'BREAKFAST',
      items: ['', '', ''],
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
        datetime: value.datetime.toString().replace('T', ' '),
      })
      await tx.isPersisted.promise
      formApi.reset()
      close()
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

export function UpdateMealSheetContent({
  meal,
  close,
}: {
  meal: Meal
  close: () => void
}) {
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
        draft.datetime = value.datetime.toString().replace('T', ' ')
        draft.items = value.items.filter((item) => item.trim() !== '')
        draft.type = value.type
      })
      await tx.isPersisted.promise
      formApi.reset()
      close()
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

          <MealActionsMenu meal={meal} onDuplicate={close} onDelete={close}>
            <Button intent="outline" className="w-full">
              Actions
            </Button>
          </MealActionsMenu>
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}

export function MealActionsMenu({
  meal,
  children,
  onDuplicate,
  onDelete,
}: React.PropsWithChildren<{
  meal: Meal
  onDuplicate?: () => void
  onDelete?: () => void
}>) {
  const handleDelete = async () => {
    mealCollection.delete(meal.id)
    close()
    onDelete?.()
  }

  const handleDuplicate = async () => {
    mealCollection.insert({
      ...meal,
      id: crypto.randomUUID(),
    })
    onDuplicate?.()
  }

  return (
    <Menu>
      <MenuTrigger>{children}</MenuTrigger>
      <MenuContent placement="bottom start" className="w-full">
        <MenuItem onAction={handleDuplicate}>
          <IconDuplicate /> Duplicate
        </MenuItem>
        <MenuSeparator />
        <MenuItem isDanger onAction={handleDelete}>
          <IconTrash /> Delete
        </MenuItem>
      </MenuContent>
    </Menu>
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
                                  data-slot="suffix-button"
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
