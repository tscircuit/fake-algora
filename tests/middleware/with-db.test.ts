import { expect, test } from "bun:test"
import { createDatabase } from "lib/db/db-client"
import { withDb } from "lib/middleware/with-db"

const request = new Request("http://localhost/test") as any
const next = async () => new Response("ok")

test("reuses fallback db when middleware context has no db", async () => {
  const firstContext: Record<string, unknown> = {}
  const secondContext: Record<string, unknown> = {}

  await withDb(request, firstContext as any, next as any)
  await withDb(request, secondContext as any, next as any)

  expect(firstContext.db).toBe(secondContext.db)
})

test("preserves db supplied by an outer middleware", async () => {
  const suppliedDb = createDatabase()
  const context = { db: suppliedDb }

  await withDb(request, context as any, next as any)

  expect(context.db).toBe(suppliedDb)
})
