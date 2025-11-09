import { Button } from '@/components/ui/button'
import { mealTypeCollection } from '@/db-collections'
import { IconTrash } from '@intentui/icons'
import z from 'zod'
import { Select } from '@/components/ui/select'
import { fieldStyles } from '@/components/ui/field'
import { mealSchema } from '@/schemas/meal'
import { withFieldGroup } from '@/integrations/tanstack-form'
import {
  CalendarDateTime,
  parseTime,
  Time,
  toTime,
} from '@internationalized/date'
import { useMemo } from 'react'
import { useLiveQuery } from '@tanstack/react-db'
import { useStore } from '@tanstack/react-form'
import { Encoder } from '@/lib/encoder'
import { MealRepo } from '@/db-collections/meal'
import { calendarDateTimeEncoder } from '@/lib/internationalized'

const { label } = fieldStyles()

export const mealFormEncoder: Encoder<
  MealRepo.Record,
  z.infer<typeof mealFormSchema>
> = {
  decode: (value) => ({
    ...value,
    datetime: calendarDateTimeEncoder.decode(value.datetime),
  }),
  encode: (value) => ({
    ...value,
    datetime: calendarDateTimeEncoder.encode(value.datetime),
  }),
}

export const mealFormSchema = mealSchema.extend({
  datetime: z.instanceof(CalendarDateTime),
})

export const FieldGroupMeal = withFieldGroup({
  defaultValues: {} as z.infer<typeof mealFormSchema>,
  render: function Render({ group }) {
    const { data: meal_types } = useLiveQuery((q) =>
      q
        .from({ type: mealTypeCollection })
        .orderBy(({ type }) => type.default_time, 'asc'),
    )

    const datetime = useStore(group.store, (state) => state.values.datetime)

    const selectedMealTypeId = useStore(
      group.store,
      (state) => state.values.meal_type_id,
    )

    const selectedMealType = useMemo(() => {
      return meal_types.find((meal_type) => meal_type.id === selectedMealTypeId)
    }, [meal_types, selectedMealTypeId])

    return (
      <>
        <group.AppField
          name="meal_type_id"
          listeners={{
            onChange({ value }) {
              const newlySelectedMealType = meal_types.find(
                (meal_type) => meal_type.id === value,
              )
              if (!newlySelectedMealType) return

              const currentTime = toTime(datetime)
              const previouslySelectedMealType = selectedMealType
              const previousMealTypeDefaultTime =
                previouslySelectedMealType &&
                parseTime(previouslySelectedMealType.default_time)

              const isDefaultNoonTime =
                currentTime.compare(new Time(12, 0)) === 0
              const isPreviousMealTypeTime =
                previousMealTypeDefaultTime &&
                currentTime.compare(previousMealTypeDefaultTime) === 0

              if (isDefaultNoonTime || isPreviousMealTypeTime) {
                const newMealTypeDefaultTime = parseTime(
                  newlySelectedMealType.default_time,
                )
                group.setFieldValue(
                  'datetime',
                  datetime.set(newMealTypeDefaultTime),
                )
              }
            },
          }}
        >
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

        <group.AppField name="datetime">
          {(field) => (
            <field.DatePicker
              label={selectedMealType?.consider_time ? 'Date and Time' : 'Date'}
              granularity={selectedMealType?.consider_time ? 'minute' : 'day'}
            />
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
