import { NeonDatabase, NeonQueryResultHKT } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import { ExtractTablesWithRelations } from 'drizzle-orm'
import { createContext } from '../context'
import { PgTransaction, PgTransactionConfig } from 'drizzle-orm/pg-core'
import * as schema from './schema'

export namespace DB {
  export type Transaction = PgTransaction<
    NeonQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >

  type DB = NeonDatabase<typeof schema> & {
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
