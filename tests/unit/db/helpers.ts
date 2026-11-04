// Postgres real (PGlite, WASM) con un stub mínimo de Supabase y las migraciones del proyecto, para
// probar RLS y funciones sin Docker. `as` ejecuta como lo haría la API: rol y claims del JWT.
import { readdirSync, readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

const root = new URL('../../../supabase/', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

export async function openDb(): Promise<PGlite> {
  const db = new PGlite()
  await db.exec(read('tests/stub.sql'))
  for (const file of readdirSync(new URL('migrations/', root)).sort()) await db.exec(read(`migrations/${file}`))
  return db
}

/** Corre `sql` como `authenticated` con ese correo, o como `anon` si es `null`. Confirma la transacción. */
export async function as<T = Record<string, unknown>>(db: PGlite, email: string | null, sql: string, params: unknown[] = []): Promise<T[]> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(email ? { email, role: 'authenticated' } : { role: 'anon' })])
    await tx.exec(`set local role ${email ? 'authenticated' : 'anon'}`)
    return (await tx.query<T>(sql, params)).rows
  })
}

export const row = (id: string, updatedAt: string, data: object = { id }, deletedAt: string | null = null) => ({
  id,
  data,
  updated_at: updatedAt,
  deleted_at: deletedAt,
})
