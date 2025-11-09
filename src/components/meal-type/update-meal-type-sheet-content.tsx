import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import z from 'zod'
import { MealTypeRepo } from '@/db-collections/meal-type'
import {
  mealTypeFormEncoder,
  mealTypeFormSchema,
} from './field-group-meal-type'
import { FieldGroupMealType } from './field-group-meal-type'
import { MealTypeActionsMenu } from './meal-type-actions-menu'

export function UpdateMealTypeSheetContent({
  mealType,
  close,
}: {
  mealType: MealTypeRepo.Record
  close: () => void
}) {
  const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(
    () => mealTypeFormEncoder.decode(mealType),
    [mealType],
  )

  const form = useAppForm({
    validators: {
      onSubmit: mealTypeFormSchema,
    },
    defaultValues,
    async onSubmit({ value, formApi }) {
      const tx = MealTypeRepo.update(
        mealType.id,
        mealTypeFormEncoder.encode(value),
      )
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
