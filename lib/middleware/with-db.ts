import type { DbClient } from "lib/db/db-client"
import { createDatabase } from "lib/db/db-client"
import type { Middleware } from "winterspec"

let defaultDb: DbClient | undefined

export const getDefaultDb = () => {
  defaultDb ??= createDatabase()
  return defaultDb
}

export const resetDefaultDbForTests = () => {
  defaultDb = createDatabase()
}

export const withDb: Middleware<
  {},
  {
    db: DbClient
  }
> = async (req, ctx, next) => {
  if (!ctx.db) {
    ctx.db = getDefaultDb()
  }
  return next(req, ctx)
}
