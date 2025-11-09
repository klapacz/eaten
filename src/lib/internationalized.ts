import {
  CalendarDateTime,
  parseDateTime,
  parseTime,
  Time,
} from '@internationalized/date'
import { Encoder } from './encoder'
import { Temporal } from 'temporal-polyfill'

export const calendarDateTimeEncoder: Encoder<
  Temporal.PlainDateTime,
  CalendarDateTime
> = {
  decode: (value) => parseDateTime(value.toString()),
  encode: (value) => Temporal.PlainDateTime.from(value.toString()),
}

export const timeEncoder: Encoder<Temporal.PlainTime, Time> = {
  decode: (value) => parseTime(value.toString()),
  encode: (value) => Temporal.PlainTime.from(value.toString()),
}
