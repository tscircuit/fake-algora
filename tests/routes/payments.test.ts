import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, replay, list, get, and complete a payment", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_cents: 1000,
    currency: "USD",
    bounty_issue_url: "https://github.com/tscircuit/fake-algora/issues/1",
    memo: "fake bounty payout",
    idempotency_key: "issue-1-pr-123",
  })

  expect(firstResponse.data.replayed).toBe(false)
  expect(firstResponse.data.payment.status).toBe("pending")
  expect(typeof firstResponse.data.payment.payment_id).toBe("string")

  const paymentId = firstResponse.data.payment.payment_id
  const replayResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_cents: 1000,
    currency: "USD",
    idempotency_key: "issue-1-pr-123",
  })

  expect(replayResponse.data.replayed).toBe(true)
  expect(replayResponse.data.payment.payment_id).toBe(paymentId)

  const pendingPaymentsResponse = await axios.get(
    "/payments/list?status=pending",
  )
  expect(pendingPaymentsResponse.data.payments).toHaveLength(1)

  const paymentResponse = await axios.get(
    `/payments/get?payment_id=${paymentId}`,
  )
  expect(paymentResponse.data.payment.payment_id).toBe(paymentId)

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })

  expect(completeResponse.data.ok).toBe(true)
  expect(completeResponse.data.payment.status).toBe("completed")
  expect(typeof completeResponse.data.payment.completed_at).toBe("string")

  const completedPaymentsResponse = await axios.get(
    "/payments/list?status=completed",
  )
  expect(completedPaymentsResponse.data.payments).toHaveLength(1)
})

test("cancel rejects missing and terminal payments safely", async () => {
  const { axios } = await getTestServer()

  const missingResponse = await axios.post("/payments/cancel", {
    payment_id: "missing-payment",
  })

  expect(missingResponse.data.ok).toBe(false)
  expect(missingResponse.data.error).toBe("payment_not_found")

  const { data } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_cents: 500,
    currency: "USD",
  })

  const paymentId = data.payment.payment_id
  const cancelResponse = await axios.post("/payments/cancel", {
    payment_id: paymentId,
  })

  expect(cancelResponse.data.ok).toBe(true)
  expect(cancelResponse.data.payment.status).toBe("canceled")

  const completeCanceledResponse = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })

  expect(completeCanceledResponse.data.ok).toBe(false)
  expect(completeCanceledResponse.data.error).toBe("payment_already_terminal")
  expect(completeCanceledResponse.data.payment.status).toBe("canceled")
})
