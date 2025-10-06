import { sql, TablesRelationalConfig } from 'drizzle-orm'
import { PgQueryResultHKT, PgTransaction } from 'drizzle-orm/pg-core'

export async function generateTxId<
  TQueryResult extends PgQueryResultHKT,
  TFullSchema extends Record<string, unknown> = Record<string, never>,
  TSchema extends TablesRelationalConfig = Record<string, never>,
>(tx: PgTransaction<TQueryResult, TFullSchema, TSchema>) {
  // The ::xid cast strips off the epoch, giving you the raw 32-bit value
  // that matches what PostgreSQL sends in logical replication streams
  // (and then exposed through Electric which we'll match against
  // in the client).
  const result = await tx.execute(
    sql`SELECT pg_current_xact_id()::xid::text as txid`,
  )
  // @ts-expect-error
  const txid = result.rows[0]?.txid

  if (typeof txid !== 'string') {
    throw new Error(`Failed to get transaction ID: ${txid}`)
  }

  return parseInt(txid as string, 10)
}
