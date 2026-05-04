import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres/session'
import type { PgTransaction, PgTransactionConfig } from 'drizzle-orm/pg-core'
import type { Pool } from 'pg'
import { createContext } from '../context'
import * as schema from './schema'

export namespace DB {
  export type Transaction = PgTransaction<
    NodePgQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >

  export type DB = NodePgDatabase<typeof schema> & {
    $client: Pool
  }

  type TxOrDb = Transaction | DB

  export const DBContext = createContext<{
    db: DB
  }>()

  const TransactionContext = createContext<{
    tx: Transaction
    effects: (() => void | Promise<void>)[]
  }>()

  export async function use<T>(callback: (trx: TxOrDb) => Promise<T>) {
    try {
      const { tx } = TransactionContext.use()
      return callback(tx)
    } catch {
      const { db } = DBContext.use()
      return callback(db)
    }
  }

  export async function afterTx(effect: () => any | Promise<any>) {
    try {
      const { effects } = TransactionContext.use()
      effects.push(effect)
    } catch {
      await effect()
    }
  }

  export async function createTx<T>(
    callback: (tx: Transaction) => Promise<T>,
    isolationLevel?: PgTransactionConfig['isolationLevel'],
  ): Promise<T> {
    try {
      const { tx } = TransactionContext.use()
      return callback(tx)
    } catch {
      const { db } = DBContext.use()
      const effects: (() => void | Promise<void>)[] = []
      const result = await db.transaction(
        async (tx) => {
          return TransactionContext.provide({ tx, effects }, () => callback(tx))
        },
        {
          isolationLevel: isolationLevel || 'read committed',
        },
      )
      await Promise.all(effects.map((x) => x()))
      return result as T
    }
  }
}
