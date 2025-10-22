import { createFileRoute } from '@tanstack/react-router'
import { createElectricSyncHandler } from '@/lib/electric.server'
import { AuthContext } from '@/auth/server'

export const Route = createFileRoute('/api/sync/meal_type')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return createElectricSyncHandler(request, async (searchParams) => {
          const session = await AuthContext.getSession()

          searchParams.set('table', 'meal_type')
          searchParams.set('where', `user_id = '${session.user.id}'`)
          searchParams.set(
            'columns',
            'id,default_time,name,consider_time,color',
          )
        })
      },
    },
  },
})
