import { AuthContext } from '@/auth/server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const auth = AuthContext.get()
        return auth.handler(request)
      },
      POST: ({ request }) => {
        const auth = AuthContext.get()
        return auth.handler(request)
      },
    },
  },
})
