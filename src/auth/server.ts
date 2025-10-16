import { createBetterAuth } from '@/auth/setup'
import { createContext } from '@/context'
import { DB } from '@/db/client'
import {
  auth_account,
  auth_session,
  auth_verification,
  auth_user,
} from '@/db/auth.schema'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth'
import { Resend } from 'resend'
import { env } from 'cloudflare:workers'
import { createAuthMiddleware } from 'better-auth/plugins'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import {
  createDefaultMealTypesForUser,
  listUserMealTypes,
} from '@/data/meal_type.repo'

const resend = new Resend(env.RESEND_API_KEY)

export namespace AuthContext {
  const Context = createContext<{
    auth: ReturnType<typeof createBetterAuth>
  }>()

  export type Config = Omit<
    Parameters<typeof createBetterAuth>[0],
    'database' | 'emailOTPOptions'
  > & {
    adapter: {
      drizzleDb: DB.DB
      provider: Parameters<typeof drizzleAdapter>[1]['provider']
    }
  }

  export function provide<T>(config: Config, cb: () => T) {
    const auth = createBetterAuth({
      database: drizzleAdapter(config.adapter.drizzleDb, {
        provider: config.adapter.provider,
        schema: {
          auth_user,
          auth_account,
          auth_session,
          auth_verification,
        },
      }),
      emailOTPOptions: {
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== 'sign-in') {
            throw new APIError('BAD_REQUEST', {
              message: 'Only sign-in requests are supported',
            })
          }

          console.log(`Sending OTP ${otp} to email ${email}.`)

          const subject = 'Your login code for Eaten'
          const messageText = `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.\n\nThanks,\nEaten Team`
          const messageHtml = `<p>Your verification code is: <strong>${otp}</strong></p>\n<p>This code will expire in 10 minutes.</p>\n<p>If you didn't request this code, you can safely ignore this email.</p>\n<p>Thanks,<br>Eaten Team</p>`

          await resend.emails.send({
            from: 'Eaten <no-reply@manotes.dev>',
            to: [email],
            subject: subject,
            text: messageText,
            html: messageHtml,
          })
        },
      },
      hooks: {
        after: createAuthMiddleware(async (ctx) => {
          if (ctx.path === '/sign-in/email-otp') {
            type Returned = { user: { id: string } }
            const userId = (ctx.context.returned as Returned).user.id

            const hasUserMealTypes =
              (await listUserMealTypes({ userId })).length > 0

            if (!hasUserMealTypes) {
              await createDefaultMealTypesForUser({ userId })
            }
          }
        }),
        before: createAuthMiddleware(async (ctx) => {
          if (ctx.path !== '/email-otp/send-verification-otp') {
            return
          }

          const email = serializeEmail(ctx.body?.email)

          if (!email) {
            throw new APIError('BAD_REQUEST', {
              message: 'Email is required',
            })
          }

          if (!ADMIN_EMAILS.includes(email)) {
            throw new APIError('UNAUTHORIZED', {
              message: 'You are not authorized to perform this action.',
            })
          }
        }),
      },
      ...config,
    })

    return Context.provide({ auth }, cb)
  }

  export function get() {
    return Context.use().auth
  }

  export function findSession() {
    return Context.use().auth.api.getSession({
      headers: getRequestHeaders(),
    })
  }

  export async function getSession() {
    const session = await findSession()
    if (!session) {
      throw redirect({ to: '/auth/login' })
    }
    return session
  }
}

const ADMIN_EMAILS = env.ADMIN_EMAIL.split(',').map((email) => email.trim())

export function serializeEmail(email: string | undefined): string | undefined {
  return email?.toLowerCase().trim()
}
