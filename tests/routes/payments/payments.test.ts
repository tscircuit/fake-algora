import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends and lists fake payments", async () => {
  const { axios } = await getTestServer()

  const { data, status } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(status).toBe(201)
  expect(data.payment).toMatchObject({
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const listResponse = await axios.get("/payments/list?status=pending")

  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].payment_id).toBe(data.payment.payment_id)
})

test("reuses an existing payment for the same idempotency key", async () => {
  const { axios } = await getTestServer()

  const first = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    idempotency_key: "retry-safe-transfer",
  })
  const retry = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    idempotency_key: "retry-safe-transfer",
  })

  expect(retry.data.payment.payment_id).toBe(first.data.payment.payment_id)

  const listResponse = await axios.get("/payments/list")

  expect(listResponse.data.payments).toHaveLength(1)
})

test("retrieves and completes a payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
  })
  const paymentId = sendResponse.data.payment.payment_id

  const getResponse = await axios.get(`/payments/get?payment_id=${paymentId}`)

  expect(getResponse.data.payment.payment_id).toBe(paymentId)

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })

  expect(completeResponse.data.payment.status).toBe("completed")
  expect(completeResponse.data.payment.updated_at).not.toBe(
    sendResponse.data.payment.updated_at,
  )
})

test("cancels and fails payments", async () => {
  const { axios } = await getTestServer()

  const cancelTarget = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
  })
  const failTarget = await axios.post("/payments/send", {
    recipient: "hubot",
    amount: 20,
  })

  const cancelled = await axios.post("/payments/cancel", {
    payment_id: cancelTarget.data.payment.payment_id,
  })
  const failed = await axios.post("/payments/fail", {
    payment_id: failTarget.data.payment.payment_id,
    reason: "insufficient fake funds",
  })

  expect(cancelled.data.payment.status).toBe("cancelled")
  expect(failed.data.payment.status).toBe("failed")
  expect(failed.data.payment.failure_reason).toBe("insufficient fake funds")
})

test("returns 404 for missing payments", async () => {
  const { axios } = await getTestServer()

  try {
    await axios.get("/payments/get?payment_id=pay_missing")
    throw new Error("Expected request to fail")
  } catch (error: any) {
    expect(error.status).toBe(404)
    expect(error.data).toEqual({
      ok: false,
      error: 'Payment "pay_missing" was not found',
    })
  }
})
