# Meal Type Colors Implementation Plan

## Overview

This document outlines a comprehensive plan for adding color support to meal_types in the application. Colors will enhance visual differentiation of meal types throughout the UI, making it easier for users to identify meals at a glance in calendars, tables, and forms.

---

## Current State Analysis

### Existing Implementation

**Database Schema (`meal_type` table)**:
- `id` (uuid): Primary key
- `name` (text): Meal type name
- `default_time` (time): Default time for the meal type
- `consider_time` (boolean): Whether to track time for this meal type
- `user_id` (text): Foreign key to auth_user

**Current Meal Types** (defaults):
- Breakfast (08:00)
- Brunch (10:00)
- Lunch (13:00)
- Afternoon Snack (16:00)
- Dinner (19:00)

**Display Locations**:
1. Meal Type Management page (`/_app/meal-type`) - Table view
2. Create/Edit Meal Type forms (Sheet modals)
3. Meal selection dropdown (when creating/editing meals)
4. Calendar view - Meal cards
5. Meals table - Type name column

**Available Color Components**:
- ColorArea, ColorPicker, ColorSlider, ColorSwatch, ColorThumb, ColorWheel
- Located in: `/src/components/ui/color-*`

---

## Goals & Requirements

### Primary Goals

1. **Visual Differentiation**: Enable users to quickly identify meal types by color
2. **Customization**: Allow users to assign custom colors to meal types
3. **Consistency**: Maintain color consistency across all UI components
4. **Accessibility**: Ensure color choices meet WCAG contrast requirements
5. **User Experience**: Provide intuitive color selection and preview

### Technical Requirements

1. Database schema must support color storage (hex format recommended)
2. Color validation and sanitization
3. Default colors for existing and new meal types
4. Migration strategy for existing data
5. Real-time sync via Electric SQL
6. Type-safe color handling throughout the stack

### UI/UX Requirements

1. Color picker in meal type create/edit forms
2. Color indicators in meal type list
3. Color-coded meal cards in calendar view
4. Color badges in meal selection dropdown
5. Proper contrast for text readability
6. Preview colors before saving

---

## Implementation Plan

### Phase 1: Database & Schema Changes

#### 1.1 Create Database Migration

**File**: `drizzle/00XX_add_meal_type_color.sql`

```sql
-- Add color column to meal_type table
ALTER TABLE "meal_type"
ADD COLUMN "color" text;

-- Set default colors for existing meal types
-- Use a standardized color palette
UPDATE "meal_type"
SET "color" = CASE
  WHEN LOWER("name") = 'breakfast' THEN '#FFA500' -- Orange
  WHEN LOWER("name") = 'brunch' THEN '#FFD700'    -- Gold
  WHEN LOWER("name") = 'lunch' THEN '#4CAF50'      -- Green
  WHEN LOWER("name") = 'afternoon snack' THEN '#9C27B0' -- Purple
  WHEN LOWER("name") = 'dinner' THEN '#2196F3'     -- Blue
  ELSE '#64748B' -- Slate gray as fallback
END;

-- Make color NOT NULL after setting defaults
ALTER TABLE "meal_type"
ALTER COLUMN "color" SET NOT NULL;

-- Add check constraint for hex color format
ALTER TABLE "meal_type"
ADD CONSTRAINT "meal_type_color_format_check"
CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$');
```

**Considerations**:
- Use 6-digit hex format (#RRGGBB)
- Provide sensible default colors
- Validate format at database level
- Migration should handle case-insensitive name matching

#### 1.2 Update Drizzle Schema

**File**: `src/db/schema.ts`

```typescript
export const mealTypeTable = pgTable(
  'meal_type',
  {
    id: uuid().defaultRandom().primaryKey(),
    defaultTime: time().notNull(),
    name: text().notNull(),
    considerTime: boolean().notNull().default(true),
    color: text().notNull(), // New field
    userId: text()
      .notNull()
      .references(() => auth_user.id),
  },
  (t) => [
    unique().on(t.userId, t.name),
    // Add check constraint for hex color format
    check('meal_type_color_format_check', sql`${t.color} ~ '^#[0-9A-Fa-f]{6}$'`),
  ],
)
```

---

### Phase 2: Schema Validation & Type Definitions

#### 2.1 Update Zod Schema

**File**: `src/schemas/meal_type.ts`

```typescript
import { z } from 'zod'

// Hex color regex validator
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

export const mealTypeSchema = z.object({
  id: z.uuid(),
  default_time: z.iso.time(),
  name: z.string().min(1),
  consider_time: z.boolean(),
  color: z.string().regex(hexColorRegex, 'Color must be a valid hex color (#RRGGBB)'),
})

export const mealTypeFormSchema = mealTypeSchema.extend({
  default_time: z.instanceof(Time),
})

// Helper to validate and normalize color input
export function normalizeColor(color: string): string {
  const normalized = color.trim().toUpperCase()
  if (!hexColorRegex.test(normalized)) {
    throw new Error('Invalid color format')
  }
  return normalized
}

// Helper to check color contrast for accessibility
export function getContrastColor(hexColor: string): '#FFFFFF' | '#000000' {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
```

---

### Phase 3: Data Layer Updates

#### 3.1 Update API Sync Endpoint

**File**: `src/routes/api.sync.meal_type.ts`

Update the Electric SQL sync to include color field:

```typescript
shapes: [
  {
    url: `${ctx.electric_url}/v1/shape`,
    params: {
      table: 'meal_type',
      where: `user_id='${userIdFromToken}'`,
      columns: 'id,default_time,name,consider_time,color', // Add color
    },
  },
]
```

#### 3.2 Update Repository Functions

**File**: `src/data/meal_type.repo.ts`

```typescript
// Update default meal types to include colors
export async function createDefaultMealTypesForUser(userId: string) {
  const defaultMealTypes = [
    { name: 'Breakfast', defaultTime: '08:00', color: '#FFA500' },
    { name: 'Brunch', defaultTime: '10:00', color: '#FFD700' },
    { name: 'Lunch', defaultTime: '13:00', color: '#4CAF50' },
    { name: 'Afternoon Snack', defaultTime: '16:00', color: '#9C27B0' },
    { name: 'Dinner', defaultTime: '19:00', color: '#2196F3' },
  ]

  await db.insert(mealTypeTable).values(
    defaultMealTypes.map((mt) => ({
      name: mt.name,
      defaultTime: mt.defaultTime,
      considerTime: true,
      color: mt.color,
      userId,
    }))
  )
}
```

#### 3.3 Update Server Actions

**File**: `src/data/meal_type.ts`

```typescript
export const createMealTypeServer = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().min(1),
      default_time: z.iso.time(),
      consider_time: z.boolean(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Add color validation
    })
  )
  .handler(async ({ context, data }) => {
    // ... existing code ...
    await db.insert(mealTypeTable).values({
      name: data.name,
      defaultTime: data.default_time,
      considerTime: data.consider_time,
      color: data.color.toUpperCase(), // Normalize to uppercase
      userId,
    })
  })

export const updateMealTypeServer = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.uuid(),
      name: z.string().min(1),
      default_time: z.iso.time(),
      consider_time: z.boolean(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Add color validation
    })
  )
  .handler(async ({ context, data }) => {
    // ... existing code ...
    await db
      .update(mealTypeTable)
      .set({
        name: data.name,
        defaultTime: data.default_time,
        considerTime: data.consider_time,
        color: data.color.toUpperCase(), // Normalize to uppercase
      })
      .where(/* ... */)
  })
```

---

### Phase 4: Collection Updates

#### 4.1 Update Meal Type Collection

**File**: `src/db-collections/index.ts`

Update sync URL to include color:

```typescript
export const mealTypeCollection = electricSqlCollection({
  url: '/api/sync/meal_type',
  schema: mealTypeSchema,
  operationHandlers: {
    // ... existing handlers ...
  },
})
```

#### 4.2 Update Meal With Type Collection

Update the join query to include color:

```typescript
const mealWithTypeCollection = liveQueryCollection({
  query: () =>
    db
      .select({
        id: mealTable.id,
        items: mealTable.items,
        datetime: mealTable.datetime,
        type_name: mealTypeTable.name,
        type_consider_time: mealTypeTable.considerTime,
        type_color: mealTypeTable.color, // Add color
      })
      .from(mealTable)
      .innerJoin(mealTypeTable, eq(mealTable.mealTypeId, mealTypeTable.id))
      .where(eq(mealTypeTable.userId, userIdFromSessionStorage)),
  // ... rest of collection config
})
```

---

### Phase 5: UI Component Updates

#### 5.1 Create Color Picker Component

**File**: `src/components/meal-type-color-picker.tsx`

```tsx
import { ColorArea, ColorPicker, ColorSwatch } from '@/components/ui/color-picker'
import { Label } from '@/components/ui/field'
import { parseColor } from 'react-aria-components'

interface MealTypeColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function MealTypeColorPicker({
  value,
  onChange,
  label = 'Color',
}: MealTypeColorPickerProps) {
  const colorValue = parseColor(value)

  // Predefined color palette for quick selection
  const presetColors = [
    '#FFA500', // Orange
    '#FFD700', // Gold
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#F44336', // Red
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
    '#3F51B5', // Indigo
    '#795548', // Brown
    '#607D8B', // Blue Gray
    '#E91E63', // Pink
  ]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-4">
        {/* Preset color swatches */}
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={`w-8 h-8 rounded-md border-2 transition-all ${
                value === color ? 'border-primary ring-2 ring-primary' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>

        {/* Custom color picker */}
        <ColorPicker value={colorValue} onChange={(c) => onChange(c.toString('hex'))}>
          <ColorArea />
        </ColorPicker>
      </div>

      {/* Color preview with current hex value */}
      <div className="flex items-center gap-2">
        <ColorSwatch color={value} />
        <span className="text-sm font-mono">{value.toUpperCase()}</span>
      </div>
    </div>
  )
}
```

#### 5.2 Update Meal Type Form

**File**: `src/routes/-meal-type-shared.tsx`

Update both create and update forms:

```tsx
import { MealTypeColorPicker } from '@/components/meal-type-color-picker'

export function CreateMealTypeSheetContent({ navigate }: Props) {
  const form = useForm({
    defaultValues: {
      name: '',
      consider_time: true,
      default_time: new Time(12, 0),
      color: '#64748B', // Default gray
    },
    // ...
  })

  return (
    <form onSubmit={/* ... */}>
      <form.Field name="name">
        {/* ... existing name field ... */}
      </form.Field>

      {/* Add color picker field */}
      <form.Field name="color">
        {(field) => (
          <MealTypeColorPicker
            value={field.state.value}
            onChange={field.handleChange}
            label="Color"
          />
        )}
      </form.Field>

      <form.Field name="consider_time">
        {/* ... existing consider_time field ... */}
      </form.Field>

      {/* ... rest of form ... */}
    </form>
  )
}

// Similar updates for UpdateMealTypeSheetContent
```

#### 5.3 Update Meal Type List View

**File**: `src/routes/_app.meal-type.tsx`

Add color column to table:

```tsx
export function MealTypeListRoute() {
  const mealTypes = useLiveQuery(mealTypeCollection.liveQuery, {
    orderBy: [
      { field: 'consider_time', direction: 'asc' },
      { field: 'default_time', direction: 'asc' },
    ],
  })

  return (
    <Table>
      <TableHeader>
        <Column isRowHeader>Name</Column>
        <Column>Color</Column>
        <Column>Consider Time</Column>
        <Column>Default Time</Column>
        <Column />
      </TableHeader>
      <TableBody items={mealTypes}>
        {(item) => (
          <Row>
            <Cell>
              <div className="flex items-center gap-2">
                {/* Color swatch indicator */}
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                {item.name}
              </div>
            </Cell>
            <Cell>
              <code className="text-xs">{item.color}</code>
            </Cell>
            <Cell>{item.consider_time ? 'Yes' : 'No'}</Cell>
            <Cell>
              {item.consider_time ? (
                <FormattedTime time={parseTime(item.default_time)} />
              ) : (
                '-'
              )}
            </Cell>
            <Cell>
              <MealTypeActionsMenu mealTypeId={item.id} />
            </Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  )
}
```

#### 5.4 Update Meal Selection Dropdown

**File**: `src/routes/-shared.tsx`

Add color indicators to meal type options:

```tsx
export function FieldGroupMeal({ form, mode }: Props) {
  // ... existing code ...

  return (
    <Select selectedKey={mealTypeId} onSelectionChange={handleMealTypeChange}>
      <Label>Meal Type</Label>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectPopover>
        <SelectListBox items={mealTypesQuery.data}>
          {(item) => (
            <SelectListItem textValue={item.name}>
              <div className="flex items-center gap-2">
                {/* Color indicator */}
                <div
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </div>
            </SelectListItem>
          )}
        </SelectListBox>
      </SelectPopover>
    </Select>
  )
}
```

#### 5.5 Update Calendar Meal Cards

**File**: `src/routes/_app.calendar.tsx`

Add color accent to meal cards:

```tsx
function MealCard({ meal }: { meal: MealWithType }) {
  // Calculate contrast color for text
  const textColor = getContrastColor(meal.type_color)

  return (
    <div
      className="rounded-lg border p-3 relative overflow-hidden"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: meal.type_color,
      }}
    >
      {/* Optional: Add colored header */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: meal.type_color }}
        aria-hidden="true"
      />

      <div className="space-y-1">
        {/* Meal type badge with color */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: meal.type_color,
              color: textColor,
            }}
          >
            {meal.type_name}
          </span>
          {meal.type_consider_time && (
            <span className="text-xs text-muted-fg">
              {formatTime(meal.datetime)}
            </span>
          )}
        </div>

        {/* Items list */}
        <ul className="text-sm space-y-0.5">
          {meal.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

#### 5.6 Update Meals Table

**File**: `src/routes/_app.meal.tsx`

Add color indicator to type column:

```tsx
<Cell>
  <div className="flex items-center gap-2">
    <div
      className="w-3 h-3 rounded-full border"
      style={{ backgroundColor: meal.type_color }}
      aria-hidden="true"
    />
    {meal.type_name}
  </div>
</Cell>
```

---

### Phase 6: Voice Transcription Integration

#### 6.1 Update AI Prompt

**File**: `src/data/meal.ts`

Include colors in the meal type list for better context:

```typescript
const mealTypesFormatted = mealTypes
  .map((mt) => `- ${mt.name} (default: ${mt.default_time}, color: ${mt.color})`)
  .join('\n')
```

---

### Phase 7: Testing Strategy

#### 7.1 Unit Tests

**File**: `src/schemas/meal_type.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mealTypeSchema, normalizeColor, getContrastColor } from './meal_type'

describe('mealTypeSchema', () => {
  it('should validate valid meal type with color', () => {
    const result = mealTypeSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Breakfast',
      default_time: '08:00:00',
      consider_time: true,
      color: '#FFA500',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid color format', () => {
    const result = mealTypeSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Breakfast',
      default_time: '08:00:00',
      consider_time: true,
      color: 'orange', // Invalid
    })
    expect(result.success).toBe(false)
  })

  it('should reject color with wrong length', () => {
    const result = mealTypeSchema.safeParse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Breakfast',
      default_time: '08:00:00',
      consider_time: true,
      color: '#FFF', // Too short
    })
    expect(result.success).toBe(false)
  })
})

describe('normalizeColor', () => {
  it('should normalize lowercase to uppercase', () => {
    expect(normalizeColor('#ffa500')).toBe('#FFA500')
  })

  it('should throw on invalid format', () => {
    expect(() => normalizeColor('orange')).toThrow()
  })
})

describe('getContrastColor', () => {
  it('should return white for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#FFFFFF')
  })

  it('should return black for light colors', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#000000')
  })
})
```

#### 7.2 Integration Tests

**Test Scenarios**:
1. Create meal type with color
2. Update meal type color
3. Verify color persists after sync
4. Verify color displays correctly in UI
5. Test color picker interaction
6. Test preset color selection
7. Verify contrast calculations
8. Test migration with existing data

#### 7.3 Manual Testing Checklist

- [ ] Create new meal type with custom color
- [ ] Create new meal type with preset color
- [ ] Update existing meal type color
- [ ] Verify color appears in meal type list
- [ ] Verify color appears in meal selection dropdown
- [ ] Verify color appears on calendar meal cards
- [ ] Verify color appears in meals table
- [ ] Test color contrast on light/dark backgrounds
- [ ] Verify color syncs across devices (Electric SQL)
- [ ] Test migration with existing meal types
- [ ] Test with accessibility tools (screen readers, contrast checkers)

---

### Phase 8: Migration & Deployment

#### 8.1 Pre-Deployment Checklist

- [ ] Run database migration on staging
- [ ] Verify all existing meal types have colors
- [ ] Test Electric SQL sync with color field
- [ ] Verify API endpoints return color
- [ ] Test UI components with real data
- [ ] Run all automated tests
- [ ] Perform manual testing
- [ ] Review accessibility compliance
- [ ] Update documentation

#### 8.2 Deployment Steps

1. **Database Migration**:
   ```bash
   # Generate migration
   npm run db:generate

   # Apply migration to staging
   npm run db:migrate:staging

   # Verify migration success
   npm run db:studio
   ```

2. **Deploy Application**:
   ```bash
   # Deploy to staging
   npm run deploy:staging

   # Run smoke tests
   npm run test:e2e:staging

   # Deploy to production
   npm run deploy:production
   ```

3. **Post-Deployment Verification**:
   - Check error logs
   - Verify Electric SQL sync
   - Test color display across all views
   - Monitor performance metrics

#### 8.3 Rollback Plan

If issues occur:
1. Revert application deployment
2. Color field is NOT NULL, so database rollback requires careful handling
3. Alternative: Set all colors to default gray as hotfix
4. Investigate and fix issues in staging
5. Re-deploy when ready

---

### Phase 9: Documentation

#### 9.1 User Documentation

**Topics to Document**:
- How to assign colors to meal types
- How to use the color picker
- How to use preset colors
- How colors appear throughout the app
- Accessibility considerations

#### 9.2 Developer Documentation

**Topics to Document**:
- Color field schema and validation
- Color contrast calculation algorithm
- Available color components
- Testing color-related features
- Migration details

#### 9.3 API Documentation

Update API docs to include:
- `color` field in meal_type responses
- Color validation rules
- Example requests/responses

---

## Recommended Default Colors

### Color Palette

Based on common meal associations and good visual differentiation:

| Meal Type | Color | Hex | Reasoning |
|-----------|-------|-----|-----------|
| Breakfast | Orange | `#FFA500` | Morning, sunrise, orange juice |
| Brunch | Gold | `#FFD700` | Mid-morning, brightness |
| Lunch | Green | `#4CAF50` | Midday, fresh, healthy |
| Afternoon Snack | Purple | `#9C27B0` | Distinctive, energy |
| Dinner | Blue | `#2196F3` | Evening, calming |
| Default/New | Slate Gray | `#64748B` | Neutral, professional |

### Additional Preset Colors

For user customization:
- Red: `#F44336`
- Cyan: `#00BCD4`
- Deep Orange: `#FF5722`
- Indigo: `#3F51B5`
- Brown: `#795548`
- Blue Gray: `#607D8B`
- Pink: `#E91E63`

---

## Accessibility Considerations

### WCAG Compliance

1. **Contrast Ratios**:
   - Use `getContrastColor()` helper to ensure text readability
   - Test colors against both light and dark backgrounds
   - Aim for WCAG AA compliance (4.5:1 for normal text)

2. **Non-Color Indicators**:
   - Always show meal type name alongside color
   - Don't rely solely on color for differentiation
   - Use icons or patterns as additional indicators if needed

3. **Screen Reader Support**:
   - Use `aria-hidden="true"` on decorative color swatches
   - Provide descriptive labels for color pickers
   - Ensure form fields have proper labels

4. **Color Blindness**:
   - Test with color blindness simulators
   - Ensure chosen palette works for common types (deuteranopia, protanopia)
   - Consider offering pattern overlays as alternative

---

## Performance Considerations

1. **Database Indexing**:
   - No additional indexes needed for color field
   - Existing indexes on user_id and name remain sufficient

2. **Sync Performance**:
   - Color adds minimal payload size (~7 bytes per record)
   - No significant impact on Electric SQL sync performance

3. **Rendering Performance**:
   - Inline styles for colors should not impact performance
   - Consider CSS custom properties for frequently changing colors
   - Use memoization for contrast calculations if needed

---

## Future Enhancements

### Potential Future Features

1. **Color Gradients**: Support gradient backgrounds for meal cards
2. **Theme Integration**: Sync colors with app theme (light/dark mode)
3. **Color Analytics**: Show color usage statistics
4. **Color Templates**: Pre-built color schemes for meal types
5. **Custom Color Palettes**: User-defined color palettes
6. **Color Picker Improvements**: Add HSL/RGB input options
7. **Bulk Color Assignment**: Apply colors to multiple meal types at once
8. **Color History**: Track recently used colors

### Technical Debt & Improvements

1. Extract color utilities to shared module
2. Create reusable color badge component
3. Add color preview in meal type actions menu
4. Implement color search/filter in meal type list
5. Add color validation at form level (not just schema)

---

## Risk Assessment

### Low Risk
- Adding non-critical optional field
- Existing data remains intact
- Rollback is straightforward
- UI changes are additive

### Medium Risk
- Migration sets color to NOT NULL (requires default values)
- Electric SQL schema changes need careful testing
- Color format validation must be consistent across layers

### Mitigation Strategies
1. Thoroughly test migration on staging with production data snapshot
2. Implement database-level constraints for color format
3. Add comprehensive validation at all layers
4. Monitor Electric SQL sync after deployment
5. Provide clear rollback procedures

---

## Timeline Estimate

### Breakdown by Phase

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| Phase 1: Database & Schema | 2-3 hours | None |
| Phase 2: Schema Validation | 1-2 hours | Phase 1 |
| Phase 3: Data Layer | 2-3 hours | Phase 2 |
| Phase 4: Collections | 1-2 hours | Phase 3 |
| Phase 5: UI Components | 4-6 hours | Phase 4 |
| Phase 6: Voice Integration | 0.5-1 hour | Phase 3 |
| Phase 7: Testing | 3-4 hours | Phase 5 |
| Phase 8: Migration & Deployment | 2-3 hours | Phase 7 |
| Phase 9: Documentation | 2-3 hours | Phase 8 |

**Total Estimated Time**: 18-27 hours

**Recommended Approach**: Split into 2-3 development sessions

---

## Success Metrics

### Quantitative Metrics

1. **Migration Success**: 100% of existing meal types have colors
2. **Sync Performance**: No degradation in Electric SQL sync time
3. **Test Coverage**: >90% coverage for color-related code
4. **Accessibility**: All color contrasts meet WCAG AA standards
5. **Error Rate**: <1% validation errors for color input

### Qualitative Metrics

1. **User Experience**: Intuitive color picker interaction
2. **Visual Clarity**: Improved meal type identification in calendar/tables
3. **Consistency**: Color usage is consistent across all views
4. **Accessibility**: Screen reader friendly implementation
5. **Code Quality**: Clean, maintainable, well-documented code

---

## Conclusion

This comprehensive plan outlines a structured approach to adding color support to meal types. The implementation is designed to be:

- **Low-risk**: Additive changes with minimal impact on existing functionality
- **User-friendly**: Intuitive color selection and preview
- **Accessible**: WCAG compliant with screen reader support
- **Maintainable**: Type-safe, validated, and well-documented
- **Scalable**: Foundation for future color-related enhancements

By following this plan systematically, the feature can be delivered with confidence and quality.

---

## Appendix

### A. File Reference

**Files to Create**:
- `drizzle/00XX_add_meal_type_color.sql`
- `src/components/meal-type-color-picker.tsx`
- `src/schemas/meal_type.test.ts`

**Files to Modify**:
- `src/db/schema.ts`
- `src/schemas/meal_type.ts`
- `src/data/meal_type.ts`
- `src/data/meal_type.repo.ts`
- `src/routes/api.sync.meal_type.ts`
- `src/routes/-meal-type-shared.tsx`
- `src/routes/_app.meal-type.tsx`
- `src/routes/-shared.tsx`
- `src/routes/_app.calendar.tsx`
- `src/routes/_app.meal.tsx`
- `src/db-collections/index.ts`

### B. Useful Resources

- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [React Aria ColorPicker](https://react-spectrum.adobe.com/react-aria/ColorPicker.html)
- [Drizzle ORM Schema Documentation](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Electric SQL Documentation](https://electric-sql.com/docs)

### C. Related Issues/Tasks

- Consider adding emoji support for meal types
- Explore meal type categories (meals vs. snacks)
- Add meal type icons alongside colors
- Implement meal type templates/presets

---

**Document Version**: 1.0
**Date**: 2025-10-22
**Author**: Claude
**Status**: Ready for Implementation
