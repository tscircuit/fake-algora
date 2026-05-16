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
  expect(listRes.data.payments[0].recipient).toBe(sendBody.recipient)

  const listByRecipient = await axios.get("/payments/list", {
    params: { recipient: sendBody.recipient },
  })
  expect(listByRecipient.data.payments).toHaveLength(1)

  const listByBountyIssue = await axios.get("/payments/list", {
    params: { bounty_issue: "#1" },
  })
  expect(listByBountyIssue.data.payments).toHaveLength(1)

  const listNoMatch = await axios.get("/payments/list", {
    params: { recipient: "someone-else@example.com" },
  })
  expect(listNoMatch.data.payments).toHaveLength(0)

  const getRes = await axios.post("/payments/get", { payment_id: paymentId })
  expect(getRes.data.ok).toBe(true)
  expect(getRes.data.payment.payment_id).toBe(paymentId)

  const completeRes = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })
  expect(completeRes.data.ok).toBe(true)
  expect(completeRes.data.payment.status).toBe("completed")

  const listCompleted = await axios.get("/payments/list", {
    params: { status: "completed" },
  })
  expect(listCompleted.data.payments).toHaveLength(1)

  const cancelRes = await axios.post("/payments/cancel", {
    payment_id: paymentId,
  })
  expect(cancelRes.data.ok).toBe(false)
  expect(cancelRes.data.error).toBe("invalid_status_transition")
  expect(cancelRes.data.payment.status).toBe("completed")
})
