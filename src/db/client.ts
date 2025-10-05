import { env } from 'cloudflare:workers'
import { drizzle } from 'drizzle-orm/neon-http'

export const db = drizzle(env.DATABASE_URL)
