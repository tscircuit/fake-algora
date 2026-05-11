import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("creates, lists, and completes fake payments", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 25,
    currency: "USD",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })

  expect(sendResponse.data.payment).toMatchObject({
    recipient: "dev@example.com",
    amount: 25,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })

  const duplicateSendResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 25,
    currency: "USD",
    idempotency_key: "retry-safe-payment",
  })

  expect(duplicateSendResponse.data.payment.payment_id).toBe(
    sendResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get(
    "/payments/list?status=pending&repository=tscircuit/fake-algora",
  )
  expect(listResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.get(
    `/payments/get?payment_id=${sendResponse.data.payment.payment_id}`,
  )
  expect(getResponse.data.payment.payment_id).toBe(
    sendResponse.data.payment.payment_id,
  )

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: sendResponse.data.payment.payment_id,
  })
  expect(completeResponse.data.payment.status).toBe("completed")
})

test("cancels fake payments", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 10,
    currency: "USD",
  })

  const cancelResponse = await axios.post("/payments/cancel", {
    payment_id: sendResponse.data.payment.payment_id,
  })

  expect(cancelResponse.data.payment.status).toBe("cancelled")
})
