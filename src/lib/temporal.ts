import { StartOfWeekOptions } from 'vremel'
import { Encoder } from './encoder'
import { Temporal } from 'temporal-polyfill'

export const startOfWeekOptions: StartOfWeekOptions = {
  firstDayOfWeek: 1,
}

export const plainDateTimeEncoder: Encoder<string, Temporal.PlainDateTime> = {
  decode: (value) => Temporal.PlainDateTime.from(value),
  // Encode to psql date format for stable sorting
  encode: (value) => value.toString().replace('T', ' '),
}
