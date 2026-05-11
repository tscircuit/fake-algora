import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("payment lifecycle supports idempotent send, list, get, complete, and cancel", async () => {
  const { axios } = await getTestServer()

  const sendBody = {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "idem_1",
  }

  const firstSend = await axios.post("/payments/send", sendBody)
  const retrySend = await axios.post("/payments/send", sendBody)

  expect(firstSend.data.payment.payment_id).toBe(
    retrySend.data.payment.payment_id,
  )
  expect(firstSend.data.payment.status).toBe("pending")

  const listPending = await axios.get("/payments/list?status=pending")
  expect(listPending.data.payments).toHaveLength(1)

  const getPayment = await axios.get(
    `/payments/get?payment_id=${firstSend.data.payment.payment_id}`,
  )
  expect(getPayment.data.payment.recipient).toBe("octocat")

  const completePayment = await axios.post("/payments/complete", {
    payment_id: firstSend.data.payment.payment_id,
  })
  expect(completePayment.data.payment.status).toBe("completed")

  const cancelMissingPayment = await axios.post("/payments/cancel", {
    payment_id: "missing",
  })
  expect(cancelMissingPayment.data.payment).toBeNull()
})
