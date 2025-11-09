import { CalendarDateTime, parseDateTime } from '@internationalized/date'
import { Encoder } from './encoder'
import { Temporal } from 'temporal-polyfill'

export const calendarDateTimeEncoder: Encoder<
  Temporal.PlainDateTime,
  CalendarDateTime
> = {
  decode: (value) => parseDateTime(value.toString()),
  encode: (value) => Temporal.PlainDateTime.from(value.toString()),
}
