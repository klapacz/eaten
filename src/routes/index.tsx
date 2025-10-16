import { authClient } from '@/auth/client'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  loader: async () => {
    const session = await authClient.getSession()

    if (!session.data) {
      throw redirect({ to: '/auth/login' })
    }

    throw redirect({ to: '/calendar' })
  },
})
