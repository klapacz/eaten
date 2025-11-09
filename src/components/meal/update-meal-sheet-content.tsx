import { Button } from '@/components/ui/button'
import { mealCollection } from '@/db-collections'
import { Sheet } from '@/components/ui/sheet'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import { parseDateTime } from '@internationalized/date'
import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { Meal } from '@/schemas/meal'
import z from 'zod'
import { FieldGroupMeal, mealFormSchema } from './field-group-meal'
import { MealActionsMenu } from './meal-actions-menu'

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
