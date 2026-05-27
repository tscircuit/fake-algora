import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment and replay idempotent requests", async () => {
  const { axios } = await getTestServer()

  const requestBody = {
    recipient: "alice@example.com",
    amount: 10,
    currency: "USD",
    idempotency_key: "bounty-1-payment",
    bounty_issue: "https://github.com/tscircuit/fake-algora/issues/1",
    memo: "Bounty payment",
  }

  const firstResponse = await axios.post("/payments/send", requestBody)
  const replayResponse = await axios.post("/payments/send", requestBody)

  expect(firstResponse.data.replayed).toBe(false)
  expect(replayResponse.data.replayed).toBe(true)
  expect(replayResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("list, get, and update payment status", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount: 25,
    currency: "USD",
  })
  const paymentId = sendResponse.data.payment.payment_id

  const filteredResponse = await axios.get(
    "/payments/list?recipient=bob@example.com&status=pending",
  )
  expect(filteredResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.get(`/payments/get?payment_id=${paymentId}`)
  expect(getResponse.data.payment.recipient).toBe("bob@example.com")

  const updateResponse = await axios.post("/payments/update-status", {
    payment_id: paymentId,
    status: "completed",
  })
  expect(updateResponse.data.ok).toBe(true)
  expect(updateResponse.data.payment.status).toBe("completed")

  const completedResponse = await axios.get("/payments/list?status=completed")
  expect(completedResponse.data.payments).toHaveLength(1)
})
