import { MealTypeColorUtils } from '@/utils/meal-type-color.utils'
import { Badge } from './ui/badge'
import { CSSProperties } from 'react'

export function MealTypeBadge({
  meal_type_color,
  ...props
}: {
  meal_type_color: MealTypeColorUtils.ColorName
} & React.ComponentProps<typeof Badge>) {
  const color = meal_type_color
  const vars = MealTypeColorUtils.cssVariablesByColor[color]

  return (
    <Badge
      style={
        {
          '--badge-bg': `var(${vars.bg})`,
          '--badge-fg': `var(${vars.fg})`,
          '--badge-overlay': `var(${vars.bg})`,
        } as CSSProperties
      }
      {...props}
    />
  )
}
