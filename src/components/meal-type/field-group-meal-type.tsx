import z from 'zod'
import { withFieldGroup } from '@/integrations/tanstack-form'
import { useMemo } from 'react'
import { mealTypeSchema } from '@/schemas/meal_type'
import { Time } from '@internationalized/date'
import { useStore } from '@tanstack/react-form'
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker'
import { parseColor } from 'react-stately'
import { fieldStyles } from '@/components/ui/field'
import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'

export const mealTypeFormSchema = mealTypeSchema.extend({
  default_time: z.instanceof(Time),
})

const { label } = fieldStyles()

export const FieldGroupMealType = withFieldGroup({
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
