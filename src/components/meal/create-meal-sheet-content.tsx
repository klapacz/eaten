import { mealCollection } from '@/db-collections'
import { Sheet } from '@/components/ui/sheet'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import {
  getLocalTimeZone,
  Time,
  toCalendarDateTime,
  today,
} from '@internationalized/date'
import { useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import z from 'zod'
import { FieldGroupMeal, mealFormSchema } from './field-group-meal'

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
        items: value.items.filter((item) => item.trim() !== ''),
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
