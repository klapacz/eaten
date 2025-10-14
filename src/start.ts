import { createMiddleware, createStart } from '@tanstack/react-start'

import { Pool } from '@neondatabase/serverless'
import { env, waitUntil } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { DB } from './db/client'
import * as schema from './db/schema'

const dbContextGlobalMiddleware = createMiddleware().server(
  async ({ next }) => {
    const pool = new Pool({ connectionString: env.DATABASE_URL })
    const db = drizzle(pool, { schema })

    const result = await DB.DBContext.provide({ db }, () => next())

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
