import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "usd",
    bounty_id: "fake-algora-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })

  expect(sendResponse.data.ok).toBe(true)
  expect(sendResponse.data.idempotent_replay).toBe(false)
  expect(sendResponse.data.payment.payment_id).toBe("pay_0")
  expect(sendResponse.data.payment.currency).toBe("USD")
  expect(sendResponse.data.payment.status).toBe("pending")

  const replayResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    idempotency_key: "retry-safe-payment",
  })

  expect(replayResponse.data.idempotent_replay).toBe(true)
  expect(replayResponse.data.payment.payment_id).toBe("pay_0")

  const filteredListResponse = await axios.get(
    "/payments/list?recipient=maintainer@example.com&status=pending",
  )
  expect(filteredListResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.get("/payments/get?payment_id=pay_0")
  expect(getResponse.data.ok).toBe(true)
  expect(getResponse.data.payment.repository).toBe("tscircuit/fake-algora")

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })

  expect(completeResponse.data.ok).toBe(true)
  expect(completeResponse.data.payment.status).toBe("completed")
  expect(completeResponse.data.payment.completed_at).toBeString()
})

test("cancel leaves terminal payments unchanged", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice",
    amount: 5,
  })
  await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })

  const cancelResponse = await axios.post("/payments/cancel", {
    payment_id: "pay_0",
  })

  expect(cancelResponse.data.ok).toBe(true)
  expect(cancelResponse.data.payment.status).toBe("completed")
  expect(cancelResponse.data.payment.canceled_at).toBeUndefined()
})

test("payment lookup reports missing identifiers", async () => {
  const { axios } = await getTestServer()

  const missingQueryResponse = await axios.get("/payments/get")
  expect(missingQueryResponse.data.ok).toBe(false)
  expect(missingQueryResponse.data.error).toContain("payment_id")

  const missingPaymentResponse = await axios.post("/payments/complete", {
    payment_id: "missing",
  })
  expect(missingPaymentResponse.data.ok).toBe(false)
  expect(missingPaymentResponse.data.error).toBe("payment not found")
})
