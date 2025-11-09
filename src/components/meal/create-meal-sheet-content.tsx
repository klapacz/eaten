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
import { Temporal } from 'temporal-polyfill'

export function CreateMealSheetContent({ close }: { close: () => void }) {
  const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
    () =>
      mealFormEncoder.decode({
        id: crypto.randomUUID(),
        datetime: Temporal.Now.plainDateISO().toPlainDateTime(
          Temporal.PlainTime.from({ hour: 12 }),
        ),
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
      const tx = MealRepo.insert(mealFormEncoder.encode(value))
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
