import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { emailOTP, EmailOTPOptions } from 'better-auth/plugins'
import { reactStartCookies } from 'better-auth/react-start'

export const createBetterAuth = (config: {
  database: BetterAuthOptions['database']
  secret?: BetterAuthOptions['secret']
  socialProviders?: BetterAuthOptions['socialProviders']
  emailOTPOptions: EmailOTPOptions
  hooks?: BetterAuthOptions['hooks']
}): ReturnType<typeof betterAuth> => {
  return betterAuth({
    database: config.database,
    secret: config.secret,
    hooks: config.hooks,
    emailAndPassword: {
      enabled: false,
    },
    plugins: [
      emailOTP(config.emailOTPOptions),
      reactStartCookies(), // make sure this is the last plugin in the array
    ],
    socialProviders: config.socialProviders,
    user: {
      modelName: 'auth_user',
    },
    session: {
      modelName: 'auth_session',
    },
    verification: {
      modelName: 'auth_verification',
    },
    account: {
      modelName: 'auth_account',
    },
  })
}
