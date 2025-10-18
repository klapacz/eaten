import { Button, buttonStyles } from '@/components/ui/button'
import { mealCollection, mealTypeCollection } from '@/db-collections'
import { IconDuplicate, IconPlus, IconTrash, IconVoice } from '@intentui/icons'
import z from 'zod'
import { Sheet } from '@/components/ui/sheet'
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
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
import { Meal, mealSchema } from '@/schemas/meal'
import { ButtonGroup } from '@/components/ui/button-group'
import { Link } from '@/components/ui/link'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  RegisteredRouter,
  useNavigate,
  ValidateLinkOptions,
  ValidateNavigateOptions,
} from '@tanstack/react-router'
import { VoiceRecorder } from './-voice-recorder'
import { useLiveQuery } from '@tanstack/react-db'

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
      meal_type_id: null as never as string,
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
              meal_type_id: 'meal_type_id',
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
        draft.meal_type_id = value.meal_type_id
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
              meal_type_id: 'meal_type_id',
              items: 'items',
            }}
          />

          <Separator />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton />

          <MealActionsMenu
            meal_id={meal.id}
            onDuplicate={close}
            onDelete={close}
          >
            <Button intent="outline">Actions</Button>
          </MealActionsMenu>
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}

export function MealActionsMenu({
  meal_id,
  children,
  onDuplicate,
  onDelete,
}: React.PropsWithChildren<{
  meal_id: string
  onDuplicate?: () => void
  onDelete?: () => void
}>) {
  const handleDelete = async () => {
    mealCollection.delete(meal_id)
    close()
    onDelete?.()
  }

  const handleDuplicate = async () => {
    const meal = mealCollection.get(meal_id)
    if (!meal) return console.error('Meal not found')

    mealCollection.insert({
      ...meal,
      id: crypto.randomUUID(),
    })
    onDuplicate?.()
  }

  return (
    <Menu>
      {children}
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

export interface CreateMealButtonGroupProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TCreateMealOptions = unknown,
  TUpdateMealOptions = unknown,
> {
  createMealLinkOptions: ValidateLinkOptions<
    TRouter,
    TCreateMealOptions,
    string,
    typeof Link
  >
  updateMealNavigateOptions: (opts: {
    mealId: string
  }) => ValidateNavigateOptions<TRouter, TUpdateMealOptions>
}

export function CreateMealButtonGroup<
  TRouter extends RegisteredRouter,
  TCreateMealOptions,
  TUpdateMealOptions,
>(
  props: CreateMealButtonGroupProps<
    TRouter,
    TCreateMealOptions,
    TUpdateMealOptions
  >,
) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  return (
    <ButtonGroup>
      <Link
        className={buttonStyles({
          intent: 'secondary',
          size: isMobile ? 'sq-sm' : 'sm',
        })}
        {...props.createMealLinkOptions}
      >
        <IconPlus />
        <span className="max-sm:sr-only">Create</span>
      </Link>
      <VoiceRecorder
        onOpen={({ mealId }) => {
          void navigate(props.updateMealNavigateOptions({ mealId }))
        }}
      >
        <Button size="sq-sm">
          <IconVoice />
        </Button>
      </VoiceRecorder>
    </ButtonGroup>
  )
}

const { label } = fieldStyles()

const mealFormSchema = mealSchema.extend({
  datetime: z.instanceof(CalendarDateTime),
})

const FieldGroupMeal = withFieldGroup({
  defaultValues: {} as z.infer<typeof mealFormSchema>,
  render: function Render({ group }) {
    const { data: meal_types } = useLiveQuery((q) =>
      q
        .from({ type: mealTypeCollection })
        .orderBy(({ type }) => type.default_time, 'asc'),
    )

    return (
      <>
        <group.AppField name="datetime">
          {(field) => <field.DatePicker label="Date and Time" />}
        </group.AppField>

        <group.AppField name="meal_type_id">
          {(field) => (
            <field.SelectField label="Type">
              <Select.Trigger />
              <Select.Content items={meal_types}>
                {(meal_type) => (
                  <Select.Item id={meal_type.id} textValue={meal_type.name}>
                    {meal_type.name}
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
