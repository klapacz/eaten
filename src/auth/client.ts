import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: '', // The base URL of your auth server
  plugins: [emailOTPClient()],
})
