import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import {
  TanstackForm,
  useAppForm,
} from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import { MealType } from '@/schemas/meal_type'
import { parseTime } from '@internationalized/date'
import z from 'zod'
import { mealTypeCollection } from '@/db-collections'
import { mealTypeFormSchema } from './field-group-meal-type'
import { FieldGroupMealType } from './field-group-meal-type'
import { MealTypeActionsMenu } from './meal-type-actions-menu'

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
