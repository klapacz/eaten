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
import { Temporal } from 'temporal-polyfill'

export function CreateMealTypeSheetContent({ close }: { close: () => void }) {
  const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(
    () =>
      mealTypeFormEncoder.decode({
        id: crypto.randomUUID(),
        name: '',
        default_time: Temporal.PlainTime.from({ hour: 12, minute: 0 }),
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
      const tx = MealTypeRepo.insert(mealTypeFormEncoder.encode(value))
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
