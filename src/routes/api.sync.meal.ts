import { createFileRoute } from '@tanstack/react-router'
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'
import { AuthContext } from '@/auth/server'
import { env } from 'cloudflare:workers'

export const Route = createFileRoute('/api/sync/meal')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await AuthContext.getSession()
        // ...check user authorization
        const url = new URL(request.url)
        const originUrl = new URL(env.ELECTRIC_BASE_URL)

        // passthrough parameters from electric client
        url.searchParams.forEach((value, key) => {
          if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
            originUrl.searchParams.set(key, value)
          }
        })

        // set shape parameters
        // full spec: https://github.com/electric-sql/electric/blob/main/website/electric-api.yaml
        originUrl.searchParams.set('table', 'meal')
        originUrl.searchParams.set('where', `user_id = '${session.user.id}'`)
        originUrl.searchParams.set('columns', 'id,type,items,datetime')

        if (env.ELECTRIC_SOURCE_ID) {
          originUrl.searchParams.set('source_id', env.ELECTRIC_SOURCE_ID)
        }
        if (env.ELECTRIC_SECRET) {
          originUrl.searchParams.set('secret', env.ELECTRIC_SECRET)
        }

        const response = await fetch(originUrl)
        const headers = new Headers(response.headers)
        headers.delete('content-encoding')
        headers.delete('content-length')

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })
      },
    },
  },
})
