import { expect, test } from "bun:test"
import { join } from "node:path"
import { Request as EdgeRuntimeRequest } from "@edge-runtime/primitives"
import { createWinterSpecBundleFromDir } from "winterspec/adapters/node"

const request = async (
  path: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
  } = {},
) => {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  const req = new EdgeRuntimeRequest(`http://127.0.0.1${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const bundle = await createWinterSpecBundleFromDir(
    join(import.meta.dir, "../../routes"),
  )

  return bundle.makeRequest(req as any)
}

test("default middleware keeps payment state across requests", async () => {
  const sendResponse = await request("/payments/send", {
    method: "POST",
    body: {
      recipient: "maintainer@example.com",
      amount: 10,
      currency: "USD",
      idempotency_key: "default-middleware-key",
    },
  })
  const sendJson = await sendResponse.json()

  expect(sendJson.payment.status).toBe("pending")

  const listResponse = await request("/payments/list")
  const listJson = await listResponse.json()

  expect(
    listJson.payments.some(
      (payment: { payment_id: string }) =>
        payment.payment_id === sendJson.payment.payment_id,
    ),
  ).toBe(true)
})

test("send payment accepts Idempotency-Key header", async () => {
  const firstResponse = await request("/payments/send", {
    method: "POST",
    headers: { "Idempotency-Key": "header-idempotency-key" },
    body: {
      recipient: "maintainer@example.com",
      amount: 20,
      currency: "USD",
    },
  })
  const secondResponse = await request("/payments/send", {
    method: "POST",
    headers: { "Idempotency-Key": "header-idempotency-key" },
    body: {
      recipient: "maintainer@example.com",
      amount: 20,
      currency: "USD",
    },
  })

  const firstJson = await firstResponse.json()
  const secondJson = await secondResponse.json()

  expect(secondJson.payment.payment_id).toBe(firstJson.payment.payment_id)
})
