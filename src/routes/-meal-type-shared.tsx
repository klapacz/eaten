import { Button } from '@/components/ui/button'
import { mealTypeCollection } from '@/db-collections'
import { IconTrash } from '@intentui/icons'
import z from 'zod'
import { Sheet } from '@/components/ui/sheet'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu'
import {
  TanstackForm,
  useAppForm,
  withFieldGroup,
} from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { MealType, mealTypeSchema } from '@/schemas/meal_type'
import { parseTime, Time } from '@internationalized/date'
import { useStore } from '@tanstack/react-form'

export function CreateMealTypeSheetContent({ close }: { close: () => void }) {
  const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(
    () => ({
      id: crypto.randomUUID(),
      name: '',
      default_time: new Time(12, 0),
      consider_time: true,
    }),
    [],
  )

  const form = useAppForm({
    validators: {
      onSubmit: mealTypeFormSchema,
    },
    defaultValues,
    async onSubmit({ value, formApi }) {
      const tx = mealTypeCollection.insert({
        ...value,
        default_time: value.default_time.toString(),
      })
      await tx.isPersisted.promise
      formApi.reset()
      close()
    },
  })

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>Create Meal Type</Sheet.Title>
      </Sheet.Header>
      <TanstackForm form={form} AppForm={form.AppForm}>
        <Sheet.Body className="grid gap-4">
          <form.ServerErrorNote />

          <FieldGroupMealType
            form={form}
            fields={{
              id: 'id',
              name: 'name',
              default_time: 'default_time',
              consider_time: 'consider_time',
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

export function UpdateMealTypeSheetContent({
  mealType,
  close,
}: {
  mealType: MealType
  close: () => void
}) {
  const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(() => {
    return {
      ...mealType,
      default_time: parseTime(mealType.default_time),
    }
  }, [mealType])

  const form = useAppForm({
    validators: {
      onSubmit: mealTypeFormSchema,
    },
    defaultValues,
    async onSubmit({ value, formApi }) {
      const tx = mealTypeCollection.update(mealType.id, (draft) => {
        draft.name = value.name
        draft.default_time = value.default_time.toString()
        draft.consider_time = value.consider_time
      })
      await tx.isPersisted.promise
      formApi.reset()
      close()
    },
  })

  return (
    <>
      <Sheet.Header>
        <Sheet.Title>Meal Type</Sheet.Title>
      </Sheet.Header>
      <TanstackForm form={form} AppForm={form.AppForm}>
        <Sheet.Body className="grid gap-4">
          <form.ServerErrorNote />

          <FieldGroupMealType
            form={form}
            fields={{
              id: 'id',
              name: 'name',
              default_time: 'default_time',
              consider_time: 'consider_time',
            }}
          />

          <Separator />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton />

          <MealTypeActionsMenu meal_type_id={mealType.id} onDelete={close}>
            <Button intent="outline" className="w-full">
              Actions
            </Button>
          </MealTypeActionsMenu>
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}

export function MealTypeActionsMenu({
  meal_type_id,
  children,
  onDelete,
}: React.PropsWithChildren<{
  meal_type_id: string
  onDelete?: () => void
}>) {
  const handleDelete = async () => {
    mealTypeCollection.delete(meal_type_id)
    onDelete?.()
  }

  return (
    <Menu>
      <MenuTrigger>{children}</MenuTrigger>
      <MenuContent placement="bottom start" className="w-full">
        <MenuItem isDanger onAction={handleDelete}>
          <IconTrash /> Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

const mealTypeFormSchema = mealTypeSchema.extend({
  default_time: z.instanceof(Time),
})

const FieldGroupMealType = withFieldGroup({
  defaultValues: {} as z.infer<typeof mealTypeFormSchema>,
  render: function Render({ group }) {
    const shouldDisplayTimeField = useStore(
      group.store,
      (state) => state.values.consider_time,
    )

    return (
      <>
        <group.AppField name="name">
          {(field) => <field.TextField label="Name" />}
        </group.AppField>

        <group.AppField name="consider_time">
          {(field) => <field.CheckboxField>Consider Time</field.CheckboxField>}
        </group.AppField>

        {shouldDisplayTimeField ? (
          <group.AppField name="default_time">
            {(field) => (
              <field.TimeField label="Default Time" granularity="minute" />
            )}
          </group.AppField>
        ) : null}
      </>
    )
  },
})
