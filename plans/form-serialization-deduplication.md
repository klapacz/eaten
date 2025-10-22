# Form Serialization Deduplication Plan

## Problem Statement

Currently, form serialization/deserialization logic for `@internationalized/date` types is duplicated across multiple shared form files:

1. **`-shared.tsx`** (Meal forms)
   - DB type: `datetime: string` (format: "2025-10-22 14:30")
   - Form type: `datetime: CalendarDateTime`
   - Serialization: `value.datetime.toString().replace('T', ' ')`
   - Deserialization: `parseDateTime(meal.datetime.replace(' ', 'T'))`

2. **`-meal-type-shared.tsx`** (MealType forms)
   - DB type: `default_time: string` (ISO time format: "14:30")
   - Form type: `default_time: Time`
   - Serialization: `value.default_time.toString()`
   - Deserialization: `parseTime(mealType.default_time)`

### Current Duplication Issues

- Each form manually handles conversion between DB strings and `@internationalized/date` types
- Serialization logic scattered in `onSubmit` handlers
- Deserialization logic scattered in `defaultValues` useMemo hooks
- No type safety guaranteeing correct conversions
- Hard to maintain and error-prone when adding new forms

## Proposed Solution: Field Encoder System

Create a generic encoder/decoder system that handles bidirectional transformation between form and database representations.

### Architecture

#### 1. Core Encoder Interface

```typescript
// src/lib/form-encoders.ts

export interface FieldEncoder<TForm, TDb> {
  /**
   * Encode form value to database value
   */
  encode(formValue: TForm): TDb

  /**
   * Decode database value to form value
   */
  decode(dbValue: TDb): TForm
}
```

#### 2. Concrete Encoder Implementations

```typescript
// src/lib/form-encoders.ts

import { CalendarDateTime, Time, parseDateTime, parseTime } from '@internationalized/date'

/**
 * Encoder for CalendarDateTime <-> string (format: "YYYY-MM-DD HH:mm")
 */
export const calendarDateTimeEncoder: FieldEncoder<CalendarDateTime, string> = {
  encode: (formValue) => formValue.toString().replace('T', ' '),
  decode: (dbValue) => parseDateTime(dbValue.replace(' ', 'T'))
}

/**
 * Encoder for Time <-> string (ISO time format)
 */
export const timeEncoder: FieldEncoder<Time, string> = {
  encode: (formValue) => formValue.toString(),
  decode: (dbValue) => parseTime(dbValue)
}

/**
 * Encoder for array fields with filtering (removes empty strings)
 */
export const itemsArrayEncoder: FieldEncoder<string[], string[]> = {
  encode: (formValue) => formValue.filter((item) => item.trim() !== ''),
  decode: (dbValue) => dbValue
}
```

#### 3. Schema Encoder Helper

Create a utility to automatically transform entire schemas:

```typescript
// src/lib/form-encoders.ts

export type EncoderMap<TSchema> = {
  [K in keyof TSchema]?: FieldEncoder<any, any>
}

export interface SchemaEncoder<TDbSchema, TFormSchema> {
  /**
   * Transform database object to form object
   */
  toForm(dbValue: TDbSchema): TFormSchema

  /**
   * Transform form object to database object
   */
  toDb(formValue: TFormSchema): TDbSchema
}

export function createSchemaEncoder<TDbSchema, TFormSchema>(
  encoderMap: EncoderMap<TDbSchema>
): SchemaEncoder<TDbSchema, TFormSchema> {
  return {
    toForm(dbValue) {
      const result = { ...dbValue } as any

      for (const [field, encoder] of Object.entries(encoderMap)) {
        if (encoder && field in dbValue) {
          result[field] = encoder.decode((dbValue as any)[field])
        }
      }

      return result
    },

    toDb(formValue) {
      const result = { ...formValue } as any

      for (const [field, encoder] of Object.entries(encoderMap)) {
        if (encoder && field in formValue) {
          result[field] = encoder.encode((formValue as any)[field])
        }
      }

      return result
    }
  }
}
```

#### 4. Domain-Specific Encoders

```typescript
// src/lib/meal-encoders.ts

import { createSchemaEncoder, calendarDateTimeEncoder, itemsArrayEncoder } from './form-encoders'
import { Meal } from '@/schemas/meal'
import { CalendarDateTime } from '@internationalized/date'

export type MealFormData = Omit<Meal, 'datetime' | 'items'> & {
  datetime: CalendarDateTime
  items: string[]
}

export const mealEncoder = createSchemaEncoder<Meal, MealFormData>({
  datetime: calendarDateTimeEncoder,
  items: itemsArrayEncoder
})
```

```typescript
// src/lib/meal-type-encoders.ts

import { createSchemaEncoder, timeEncoder } from './form-encoders'
import { MealType } from '@/schemas/meal_type'
import { Time } from '@internationalized/date'

export type MealTypeFormData = Omit<MealType, 'default_time'> & {
  default_time: Time
}

export const mealTypeEncoder = createSchemaEncoder<MealType, MealTypeFormData>({
  default_time: timeEncoder
})
```

## Implementation Plan

### Phase 1: Create Encoder Infrastructure

1. Create `src/lib/form-encoders.ts` with:
   - `FieldEncoder` interface
   - `SchemaEncoder` interface
   - `createSchemaEncoder` helper
   - Common encoders: `calendarDateTimeEncoder`, `timeEncoder`, `itemsArrayEncoder`

2. Create domain-specific encoder files:
   - `src/lib/meal-encoders.ts` with `mealEncoder`
   - `src/lib/meal-type-encoders.ts` with `mealTypeEncoder`

### Phase 2: Refactor Meal Forms (`-shared.tsx`)

**Before:**
```typescript
const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
  () => ({
    ...meal,
    datetime: parseDateTime(meal.datetime.replace(' ', 'T')),
  }),
  [meal],
)

// In onSubmit:
const tx = mealCollection.update(meal.id, (draft) => {
  draft.datetime = value.datetime.toString().replace('T', ' ')
  draft.items = value.items.filter((item) => item.trim() !== '')
  draft.meal_type_id = value.meal_type_id
})
```

**After:**
```typescript
import { mealEncoder } from '@/lib/meal-encoders'

const defaultValues: z.infer<typeof mealFormSchema> = useMemo(
  () => mealEncoder.toForm(meal),
  [meal],
)

// In onSubmit:
const dbValue = mealEncoder.toDb(value)
const tx = mealCollection.update(meal.id, (draft) => {
  Object.assign(draft, dbValue)
})
```

Apply similar changes to:
- `CreateMealSheetContent`
- `UpdateMealSheetContent`

### Phase 3: Refactor MealType Forms (`-meal-type-shared.tsx`)

**Before:**
```typescript
const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(() => {
  return {
    ...mealType,
    default_time: parseTime(mealType.default_time),
  }
}, [mealType])

// In onSubmit:
const tx = mealTypeCollection.update(mealType.id, (draft) => {
  draft.name = value.name
  draft.default_time = value.default_time.toString()
  draft.consider_time = value.consider_time
})
```

**After:**
```typescript
import { mealTypeEncoder } from '@/lib/meal-type-encoders'

const defaultValues: z.infer<typeof mealTypeFormSchema> = useMemo(
  () => mealTypeEncoder.toForm(mealType),
  [mealType],
)

// In onSubmit:
const dbValue = mealTypeEncoder.toDb(value)
const tx = mealTypeCollection.update(mealType.id, (draft) => {
  Object.assign(draft, dbValue)
})
```

Apply similar changes to:
- `CreateMealTypeSheetContent`
- `UpdateMealTypeSheetContent`

### Phase 4: Testing & Validation

1. Test create operations for both Meal and MealType
2. Test update operations for both Meal and MealType
3. Verify datetime/time values are correctly stored in DB
4. Verify form loads with correct values when editing
5. Test edge cases:
   - Empty items array
   - Midnight times
   - Different timezones (if applicable)

## Benefits

### Code Quality
- **DRY Principle**: Single source of truth for each conversion
- **Type Safety**: TypeScript ensures correct encoder usage
- **Maintainability**: Changes to encoding logic happen in one place
- **Testability**: Encoders can be unit tested independently

### Developer Experience
- **Clarity**: Explicit encode/decode operations
- **Reusability**: Easy to add new encoders for future forms
- **Consistency**: All forms use the same pattern
- **Discoverability**: Encoders are centralized and documented

### Future Extensibility

Adding a new form with date/time fields becomes trivial:

```typescript
// 1. Define the encoder
export const newFormEncoder = createSchemaEncoder<DbType, FormType>({
  some_datetime: calendarDateTimeEncoder,
  some_time: timeEncoder,
})

// 2. Use in form
const defaultValues = useMemo(() => newFormEncoder.toForm(dbData), [dbData])
const onSubmit = async ({ value }) => {
  const dbValue = newFormEncoder.toDb(value)
  await collection.insert(dbValue)
}
```

## Alternative Approaches Considered

### 1. Zod Transforms
Use Zod's `.transform()` to handle serialization:

```typescript
const mealFormSchema = mealSchema.extend({
  datetime: z.string().transform(val => parseDateTime(val.replace(' ', 'T')))
})
```

**Pros:**
- Integrated with schema validation
- Less boilerplate

**Cons:**
- Transforms are unidirectional (harder to reverse)
- Mixes validation with serialization concerns
- Less explicit about what's happening

### 2. Form Adapter Pattern
Create wrapper functions around form creation:

```typescript
const form = useAppFormWithEncoder(mealEncoder, {
  validators: { onSubmit: mealFormSchema },
  defaultValues: meal,
  onSubmit: async (value) => { ... }
})
```

**Pros:**
- Hides encoder calls
- Very DRY

**Cons:**
- More abstraction (harder to understand)
- Tighter coupling to form library
- Less flexible

**Decision:** The explicit encoder approach provides the best balance of clarity, flexibility, and type safety.

## Migration Strategy

1. Implement encoder infrastructure (Phase 1)
2. Add encoders alongside existing code (no breaking changes)
3. Refactor one form at a time (Phases 2-3)
4. Test each refactored form thoroughly
5. Remove old serialization code once verified
6. Document pattern for team

## Open Questions

1. Should encoders handle null/undefined values?
   - **Recommendation:** Yes, add null-safe variants when needed

2. Should we add encoder composition utilities?
   - **Recommendation:** Add if we find repeated patterns, not prematurely

3. Should encoders throw errors or return default values on invalid input?
   - **Recommendation:** Let underlying parsers (parseDateTime, etc.) throw - fail fast

4. Should we generate encoders from Zod schemas automatically?
   - **Recommendation:** No for now - explicit is better than implicit for this use case
