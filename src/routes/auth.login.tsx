import { authClient } from '@/auth/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { InputOTP } from '@/components/ui/input-otp'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'
import { TanstackForm, useAppForm } from '@/integrations/tanstack-form'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useMutation } from '@tanstack/react-query'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
  loader: async () => {
    const session = await authClient.getSession()
    if (session.data) {
      throw redirect({ to: '/calendar' })
    }
  },
})

const emailFormSchema = z.object({
  email: z.email('Please enter a valid email'),
})

const otpFormSchema = z.object({
  otp: z.string().min(6, 'OTP must be at least 6 characters'),
})

function RouteComponent() {
  const [userEmail, setUserEmail] = useState<string>()

  return (
    <div className="p-4 mx-auto max-w-xl">
      <Card>
        <Card.Header>
          <Card.Title>
            {!userEmail ? 'Sign in' : 'Enter verification code'}
          </Card.Title>
          <Card.Description>
            {!userEmail
              ? 'Enter your email to sign in'
              : `We've sent a code to ${userEmail}`}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {userEmail ? (
            <OTPForm email={userEmail} setUserEmail={setUserEmail} />
          ) : (
            <EmailForm setUserEmail={setUserEmail} />
          )}
        </Card.Content>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4 mt-6">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}

function EmailForm({
  setUserEmail,
}: {
  setUserEmail: (email: string) => void
}) {
  const form = useAppForm({
    validators: {
      onSubmit: emailFormSchema,
    },
    defaultValues: {
      email: '',
    },
    async onSubmit({ value }) {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: value.email,
        type: 'sign-in',
      })

      if (error) {
        throw new Error(error.message)
      }

      setUserEmail(value.email)
    },
  })

  return (
    <TanstackForm form={form} AppForm={form.AppForm}>
      <div className="grid gap-6">
        <form.ServerErrorNote />

        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email"
              placeholder="m@example.com"
              type="email"
            />
          )}
        </form.AppField>

        <form.SubscribeButton className="w-full">Continue</form.SubscribeButton>
      </div>
    </TanstackForm>
  )
}

function OTPForm({
  email,
  setUserEmail,
}: {
  email: string
  setUserEmail: (email: string | undefined) => void
}) {
  const navigate = Route.useNavigate()

  const form = useAppForm({
    validators: {
      onSubmit: otpFormSchema,
    },
    defaultValues: {
      otp: '',
    },
    async onSubmit({ value }) {
      const { error } = await authClient.signIn.emailOtp({
        email: email,
        otp: value.otp,
      })

      if (error) {
        throw new Error(error.message)
      }

      void navigate({ to: '/' })
    },
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: 'sign-in',
      })
    },
  })

  return (
    <TanstackForm form={form} AppForm={form.AppForm}>
      <div className="grid gap-6">
        <form.ServerErrorNote />

        <form.AppField name="otp">
          {(field) => (
            <field.TextField label="Verification Code">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={field.state.value}
                onChange={field.handleChange}
              >
                <InputOTP.Group>
                  <InputOTP.Slot index={0} />
                  <InputOTP.Slot index={1} />
                  <InputOTP.Slot index={2} />
                  <InputOTP.Slot index={3} />
                  <InputOTP.Slot index={4} />
                  <InputOTP.Slot index={5} />
                </InputOTP.Group>
              </InputOTP>
            </field.TextField>
          )}
        </form.AppField>

        <div className="flex flex-col gap-2">
          <form.SubscribeButton className="w-full">
            Sign in
          </form.SubscribeButton>
          <Button
            type="button"
            intent="secondary"
            className="w-full"
            onPress={() => {
              setUserEmail(undefined)
            }}
          >
            Back to email
          </Button>
          <Button
            type="button"
            intent="plain"
            className="w-full"
            onPress={() => resendMutation.mutate}
            isDisabled={resendMutation.isPending}
          >
            {resendMutation.isPending ? 'Sending...' : 'Resend code'}
          </Button>
        </div>
      </div>
    </TanstackForm>
  )
}
