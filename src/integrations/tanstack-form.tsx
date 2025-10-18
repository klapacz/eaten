import { Button, ButtonProps } from '@/components/ui/button'
import { Checkbox, CheckboxProps } from '@/components/ui/checkbox'
import { DatePicker, DatePickerProps } from '@/components/ui/date-picker'
import { Form, FormProps } from '@/components/ui/form'
import { Note } from '@/components/ui/note'
import { NumberField, NumberFieldProps } from '@/components/ui/number-field'
import { Select, SelectProps } from '@/components/ui/select'
import { Switch, SwitchProps } from '@/components/ui/switch'
import { TextField, TextFieldProps } from '@/components/ui/text-field'
import { TimeField, TimeFieldProps } from '@/components/ui/time-field'
import {
  AnyFieldApi,
  AnyFormApi,
  createFormHook,
  createFormHookContexts,
  useStore,
} from '@tanstack/react-form'
import { useMemo } from 'react'
import { DateValue, Key, TimeValue } from 'react-aria'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

function FormTextField(props: TextFieldProps) {
  const field = useFieldContext<string>()

  const errorMessage = useErrorMessageFromField(field)

  return (
    <TextField
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      errorMessage={errorMessage}
      {...props}
    />
  )
}

function FormDatePicker<T extends DateValue>(props: DatePickerProps<T>) {
  const field = useFieldContext<T>()

  const errorMessage = useErrorMessageFromField(field)

  return (
    <DatePicker
      name={field.name}
      value={field.state.value}
      onChange={(newValue) => field.handleChange(newValue as unknown as T)}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      errorMessage={errorMessage}
      {...props}
    />
  )
}

function FormTimeField<T extends TimeValue>(props: TimeFieldProps<T>) {
  const field = useFieldContext<T>()

  const errorMessage = useErrorMessageFromField(field)

  return (
    <TimeField
      name={field.name}
      value={field.state.value}
      onChange={(newValue) => field.handleChange(newValue as unknown as T)}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      errorMessage={errorMessage}
      {...props}
    />
  )
}

function FormSelectField<T extends object>(props: SelectProps<T>) {
  const field = useFieldContext<Key | null>()

  const errorMessage = useErrorMessageFromField(field)

  return (
    <Select
      name={field.name}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      errorMessage={errorMessage}
      {...props}
    />
  )
}

function FormNumberField(
  props: NumberFieldProps & {
    asString?: boolean
  },
) {
  const field = useFieldContext<string | number>()

  const errorMessage = useErrorMessageFromField(field)

  return (
    <NumberField
      name={field.name}
      value={
        props.asString && typeof field.state.value === 'string'
          ? Number(field.state.value)
          : (field.state.value as number)
      }
      onChange={(newValue) =>
        field.handleChange(props.asString ? newValue.toString() : newValue)
      }
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      errorMessage={errorMessage}
      {...props}
    />
  )
}

/** Note: error messages are not implemented for this component */
function FormSwitchField(props: SwitchProps) {
  const field = useFieldContext<boolean>()

  return (
    <Switch
      name={field.name}
      isSelected={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      {...props}
    />
  )
}

function FormCheckboxField(props: CheckboxProps) {
  const field = useFieldContext<boolean>()

  return (
    <Checkbox
      name={field.name}
      isSelected={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      isInvalid={!field.state.meta.isValid}
      {...props}
    />
  )
}

export function useErrorMessageFromField(field: AnyFieldApi) {
  return useErrorMessageFromErrorsArray(field.state.meta.errors)
}

/**
 * @example
 * const errorMessage = useErrorMessageFromErrorsArray(field.state.meta.errors);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useErrorMessageFromErrorsArray(errors: any[]) {
  return useMemo(() => {
    if (!errors.length) return undefined
    return errors.map((error) => error.message).join(', ')
  }, [errors])
}

interface SubscribeButtonProps extends ButtonProps {
  allowNoChanges?: boolean
}

function SubscribeButton({
  children,
  allowNoChanges,
  ...props
}: SubscribeButtonProps) {
  const form = useFormContext()
  return (
    <form.Subscribe
      selector={(state) => [state.isSubmitting, state.isDefaultValue]}
    >
      {([isSubmitting, isDefaultValue]) => {
        return (
          <Button
            type="submit"
            isDisabled={isSubmitting || (!allowNoChanges && isDefaultValue)}
            {...props}
          >
            {children ? children : 'Submit'}
          </Button>
        )
      }}
    </form.Subscribe>
  )
}

function Debug() {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.values}>
      {(values) => <pre>{JSON.stringify(values, null, 2)}</pre>}
    </form.Subscribe>
  )
}

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    SwitchField: FormSwitchField,
    CheckboxField: FormCheckboxField,
    TextField: FormTextField,
    NumberField: FormNumberField,
    DatePicker: FormDatePicker,
    TimeField: FormTimeField,
    SelectField: FormSelectField,
  },
  formComponents: { SubscribeButton, ServerErrorNote, Debug },
})

export function ServerErrorNote() {
  const form = useFormContext()

  const serverError = useStore(
    form.store,
    (state) => state.errorMap.onServer as string | undefined,
  )

  if (!serverError) {
    return null
  }

  return <Note intent="danger">{serverError}</Note>
}

export interface TanstackFormProps extends FormProps {
  form: AnyFormApi
  AppForm: React.ComponentType<{
    children?: React.ReactNode | undefined
  }>
}

export function TanstackForm({
  form,
  children,
  AppForm,
  ...props
}: TanstackFormProps) {
  return (
    <Form
      validationBehavior="aria"
      onSubmit={async (e) => {
        e.preventDefault()
        try {
          await form.handleSubmit()
        } catch (error) {
          if (error instanceof Error) {
            form.setErrorMap({
              onServer: error.message,
            })
          }
        }
      }}
      {...props}
    >
      <AppForm>{children}</AppForm>
    </Form>
  )
}
