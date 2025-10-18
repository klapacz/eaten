import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'
import { env } from 'cloudflare:workers'

type ConfigCallback = (session: URLSearchParams) => Promise<void>

export async function createElectricSyncHandler(
  request: Request,
  configCb: ConfigCallback,
) {
  const url = new URL(request.url)
  const originUrl = new URL(env.ELECTRIC_BASE_URL)

  url.searchParams.forEach((value, key) => {
    if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
      originUrl.searchParams.set(key, value)
    }
  })

  await configCb(originUrl.searchParams)

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
}
