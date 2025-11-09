import { Button } from '@/components/ui/button'
import { MealRepo } from '@/db-collections/meal'
import { Sheet } from '@/components/ui/sheet'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import z from 'zod'
import {
  FieldGroupMeal,
  mealFormEncoder,
  mealFormSchema,
} from './field-group-meal'
import {
  MealActionsMenuOnDuplicateFn,
  MealActionsMenu,
} from './meal-actions-menu'
import { Note } from '../ui/note'

export function UpdateMealSheetContent({
  meal,
  isUpdatingDuplicated,
  onDuplicate,
  close,
}: {
  meal: MealRepo.Record
  isUpdatingDuplicated: boolean
  onDuplicate: MealActionsMenuOnDuplicateFn
  close: () => void
}) {
  const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
    () => mealFormEncoder.decode(meal),
    [meal],
  )

  const form = useAppForm({
    validators: {
      onSubmit: mealFormSchema,
    },
    defaultValues,
    async onSubmit({ value, formApi }) {
      const tx = MealRepo.update(meal.id, mealFormEncoder.encode(value))
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

          {isUpdatingDuplicated ? (
            <Note intent="info">You are editing a duplicated meal.</Note>
          ) : null}

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
            onDuplicate={onDuplicate}
            onDelete={close}
          >
            <Button intent="outline">Actions</Button>
          </MealActionsMenu>
        </Sheet.Footer>
      </TanstackForm>
    </>
  )
}
