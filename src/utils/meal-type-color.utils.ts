import { convert } from 'colorizr'

export namespace MealTypeColorUtils {
  export const colorNames = [
    'gray',
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
    'pink',
  ] as const

  export type ColorName = (typeof colorNames)[number]

  /** Note: full variable names are used to ensure tailwind can find they are used. */
  export const cssVariablesByColor: Record<
    ColorName,
    { bg: string; fg: string; preview: string }
  > = {
    gray: {
      bg: '--color-gray-100',
      fg: '--color-gray-800',
      preview: '--color-gray-400',
    },
    red: {
      bg: '--color-red-100',
      fg: '--color-red-800',
      preview: '--color-red-400',
    },
    blue: {
      bg: '--color-blue-100',
      fg: '--color-blue-800',
      preview: '--color-blue-400',
    },
    green: {
      bg: '--color-green-100',
      fg: '--color-green-800',
      preview: '--color-green-400',
    },
    yellow: {
      bg: '--color-yellow-100',
      fg: '--color-yellow-800',
      preview: '--color-yellow-400',
    },
    purple: {
      bg: '--color-purple-100',
      fg: '--color-purple-800',
      preview: '--color-purple-400',
    },
    orange: {
      bg: '--color-orange-100',
      fg: '--color-orange-800',
      preview: '--color-orange-400',
    },
    pink: {
      bg: '--color-pink-100',
      fg: '--color-pink-800',
      preview: '--color-pink-400',
    },
  }

  type GenerateHexValuesResult = Record<ColorName, string>

  export function generateHexValues() {
    const style = window.getComputedStyle(document.body)

    return Object.fromEntries(
      Object.entries(cssVariablesByColor).map(([key, value]) => [
        key,
        convert(style.getPropertyValue(value.preview), 'hex'),
      ]),
    ) as GenerateHexValuesResult
  }

  export function getColorNameByHex({
    colors,
    hex: _hex,
  }: {
    colors: GenerateHexValuesResult
    hex: string
  }): ColorName | undefined {
    const hex = _hex.toLowerCase()
    return Object.keys(colors).find(
      (key) => colors[key as ColorName].toLowerCase() === hex,
    ) as ColorName | undefined
  }
}
