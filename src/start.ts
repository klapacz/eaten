import { createMiddleware, createStart } from '@tanstack/react-start'

import { Pool } from '@neondatabase/serverless'
import { env, waitUntil } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { DB } from './db/client'
import * as schema from './db/schema'
import { AuthContext } from './auth/server'

const dbContextGlobalMiddleware = createMiddleware().server(
  async ({ next }) => {
    const pool = new Pool({ connectionString: env.DATABASE_URL })
    const db = drizzle(pool, { schema, casing: 'snake_case' })

    const authConfig: AuthContext.Config = {
      secret: env.BETTER_AUTH_SECRET,
      adapter: {
        drizzleDb: db,
        provider: 'pg',
      },
    }

    const result = await DB.DBContext.provide({ db }, () =>
      AuthContext.provide(authConfig, () => next()),
    )

    void waitUntil(pool.end())

    return result
  },
)

export const startInstance = createStart(() => {
  return {
    defaultSsr: false,
    requestMiddleware: [dbContextGlobalMiddleware],
  }
})
