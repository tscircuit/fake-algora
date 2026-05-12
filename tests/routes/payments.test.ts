import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("payment lifecycle routes work and support idempotent send", async () => {
  const { axios } = await getTestServer()

  const sendBody = {
    recipient: "dev@example.com",
    amount: 30,
    currency: "USD",
    idempotency_key: "issue-1-send-001",
    bounty_issue: "#1",
    metadata: {
      source: "algora",
    },
  }

  const firstSend = await axios.post("/payments/send", sendBody)
  expect(firstSend.data.ok).toBe(true)
  expect(firstSend.data.payment.status).toBe("pending")

  const replaySend = await axios.post("/payments/send", sendBody)
  expect(replaySend.data.ok).toBe(true)
  expect(replaySend.data.idempotent_replay).toBe(true)
  expect(replaySend.data.payment.payment_id).toBe(
    firstSend.data.payment.payment_id,
  )

  const paymentId = firstSend.data.payment.payment_id

  const listRes = await axios.get("/payments/list")
  expect(listRes.data.payments).toHaveLength(1)

  const getRes = await axios.post("/payments/get", { payment_id: paymentId })
  expect(getRes.data.ok).toBe(true)
  expect(getRes.data.payment.payment_id).toBe(paymentId)

  const completeRes = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })
  expect(completeRes.data.ok).toBe(true)
  expect(completeRes.data.payment.status).toBe("completed")

  const cancelRes = await axios.post("/payments/cancel", {
    payment_id: paymentId,
  })
  expect(cancelRes.data.ok).toBe(true)
  expect(cancelRes.data.payment.status).toBe("canceled")
})
