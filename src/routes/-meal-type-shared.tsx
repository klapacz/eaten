import { Button } from '@/components/ui/button'
import { mealTypeCollection } from '@/db-collections'
import { IconTrash } from '@intentui/icons'
import z from 'zod'
import { Sheet } from '@/components/ui/sheet'
import { Menu, MenuContent, MenuItem } from '@/components/ui/menu'
import {
  TanstackForm,
  useAppForm,
  withFieldGroup,
} from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import { MealType, mealTypeSchema } from '@/schemas/meal_type'
import { parseTime, Time } from '@internationalized/date'
import { useStore } from '@tanstack/react-form'
import { toast } from 'sonner'
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker'
import { parseColor } from 'react-stately'
import { fieldStyles } from '@/components/ui/field'
import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'

export function CreateMealTypeSheetContent({ close }: { close: () => void }) {
  const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(
    () => ({
      id: crypto.randomUUID(),
      name: '',
      default_time: new Time(12, 0),
      consider_time: true,
      color: 'blue',
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
              color: 'color',
            }}
          />
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
        draft.color = value.color
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
              color: 'color',
            }}
          />
        </Sheet.Body>
        <Sheet.Footer>
          <form.SubscribeButton />

          <MealTypeActionsMenu meal_type_id={mealType.id} onDelete={close}>
            <Button intent="outline">Actions</Button>
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
    try {
      const tx = mealTypeCollection.delete(meal_type_id)
      await tx.isPersisted.promise
      onDelete?.()
    } catch (error) {
      toast.error('Failed to delete meal type', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <Menu>
      {children}
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

const { label } = fieldStyles()

const FieldGroupMealType = withFieldGroup({
  defaultValues: {} as z.infer<typeof mealTypeFormSchema>,
  render: function Render({ group }) {
    const shouldDisplayTimeField = useStore(
      group.store,
      (state) => state.values.consider_time,
    )

    const colors = useMemo(() => MealTypeColorUtils.generateHexValues(), [])

    return (
      <>
        <group.AppField name="name">
          {(field) => <field.TextField label="Name" />}
        </group.AppField>

        <group.AppField name="color">
          {(field) => (
            <div className="flex flex-col gap-y-1 min-w-0">
              <span className={label({ className: 'font-medium' })}>
                Pick Color
              </span>

              <div className="overflow-x-auto relative flex @container-scroll">
                <div className="sticky left-0 h-full w-0 overflow-visible z-100">
                  <div className="bg-gradient-to-r from-white absolute left-0 h-full w-0 @scrollable-left:w-6 transition-all duration-75"></div>
                </div>

                <div className="sticky top-0 left-[100%] h-full w-0 overflow-visible z-100">
                  <div className="bg-gradient-to-l from-white absolute right-0 h-full w-0 @scrollable-right:w-6 transition-all duration-75"></div>
                </div>
                <ColorSwatchPicker
                  aria-label="Pick color"
                  value={parseColor(colors[field.state.value])}
                  onChange={(colorInstance) => {
                    const color = MealTypeColorUtils.getColorNameByHex({
                      colors,
                      hex: colorInstance.toString('hex'),
                    })

                    if (color) field.setValue(color)
                  }}
                  className="flex gap-2"
                >
                  {Object.entries(colors).map(([colorName, color]) => (
                    <AutoShowColorSwatchPickerItem
                      shouldShow={colorName === field.state.value}
                      color={color}
                      key={color}
                      className="shrink-0"
                    />
                  ))}
                </ColorSwatchPicker>
              </div>
            </div>
          )}
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

function AutoShowColorSwatchPickerItem({
  shouldShow: current,
  ...props
}: React.ComponentProps<typeof ColorSwatchPicker.Item> & {
  shouldShow: boolean
}) {
  const callbackRef = (node: HTMLDivElement | null) => {
    if (current && node) {
      node.scrollIntoView()
    }
  }

  return <ColorSwatchPicker.Item ref={callbackRef} {...props} />
}
