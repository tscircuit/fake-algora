import { beforeEach, expect, test } from "bun:test"
import { join } from "node:path"
import { Request as EdgeRuntimeRequest } from "@edge-runtime/primitives"
import { resetDefaultDbForTests } from "lib/middleware/with-db"
import { createWinterSpecBundleFromDir } from "winterspec/adapters/node"

const makeRequest = async (path: string, init?: RequestInit) => {
  const winterspecBundle = await createWinterSpecBundleFromDir(
    join(import.meta.dir, "../../routes"),
  )
  const req = new EdgeRuntimeRequest(`http://127.0.0.1${path}`, init)
  const res = await winterspecBundle.makeRequest(req as any)

  return {
    status: res.status,
    data: await res.json(),
  }
}

beforeEach(() => {
  resetDefaultDbForTests()
})

test("default database middleware preserves payments across requests", async () => {
  await makeRequest("/payments/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      recipient_email: "solver@example.com",
      amount_cents: 1000,
    }),
  })

  const listRes = await makeRequest("/payments/list")
  const getRes = await makeRequest("/payments/get?payment_id=payment_0")

  expect(listRes.status).toBe(200)
  expect(listRes.data.payments).toHaveLength(1)
  expect(getRes.status).toBe(200)
  expect(getRes.data.payment).toMatchObject({
    payment_id: "payment_0",
    recipient_email: "solver@example.com",
  })
})
