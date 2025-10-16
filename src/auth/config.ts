import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createBetterAuth } from './setup'

// This is only used to generate config (see package.json generate:auth script)
export const auth = createBetterAuth({
  database: drizzleAdapter(undefined as any, {
    provider: 'pg',
  }),
  emailOTPOptions: undefined as any,
})
