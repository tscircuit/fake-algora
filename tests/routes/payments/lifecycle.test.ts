import { expect, test } from "bun:test"
import { join } from "node:path"
import { Request as EdgeRuntimeRequest } from "@edge-runtime/primitives"
import { getTestServer } from "tests/fixtures/get-test-server"
import { createWinterSpecBundleFromDir } from "winterspec/adapters/node"

test("sends and completes a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "fake-algora-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.payment.payment_id).toBe("0")
  expect(sendData.payment.status).toBe("pending")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("completed")

  const { data: getData } = await axios.get("/payments/get", {
    params: { payment_id: sendData.payment.payment_id },
  })

  expect(getData.payment.status).toBe("completed")
})

test("does not duplicate payments when an idempotency key is reused", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "contributor@example.com",
    amount: 20,
    currency: "USD",
    idempotency_key: "retry-safe-key",
  }

  const { data: firstSend } = await axios.post("/payments/send", payload)
  const { data: secondSend } = await axios.post("/payments/send", payload)
  const { data: listData } = await axios.get("/payments/list")

  expect(firstSend.payment.payment_id).toBe(secondSend.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("filters listed payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "first@example.com",
    amount: 10,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient: "second@example.com",
    amount: 15,
    repository: "tscircuit/other",
  })

  const { data } = await axios.get("/payments/list", {
    params: { repository: "tscircuit/fake-algora" },
  })

  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].recipient).toBe("first@example.com")
})

test("shares payment records when no db middleware is injected", async () => {
  const winterspecBundle = await createWinterSpecBundleFromDir(
    join(import.meta.dir, "../../../routes"),
  )
  const idempotencyKey = `production-path-${Math.random().toString(36).slice(2)}`

  const sendResponse = await winterspecBundle.makeRequest(
    new EdgeRuntimeRequest("http://localhost/payments/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: "production@example.com",
        amount: 25,
        idempotency_key: idempotencyKey,
      }),
    }) as any,
  )
  const sendData = await sendResponse.json()

  const completeResponse = await winterspecBundle.makeRequest(
    new EdgeRuntimeRequest("http://localhost/payments/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: sendData.payment.payment_id,
      }),
    }) as any,
  )
  const completeData = await completeResponse.json()

  expect(completeData.payment.status).toBe("completed")
})
