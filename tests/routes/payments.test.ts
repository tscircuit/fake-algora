import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("payment API supports send, idempotent replay, filtering, and status changes", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient_email: "dev@example.com",
    amount_cents: 1250,
    currency: "USD",
    idempotency_key: "issue-1-pr-22",
    bounty_id: "bounty_1",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    memo: "Fake Algora payout",
  })

  expect(sendResponse.status).toBe(200)
  expect(sendResponse.data.idempotent_replay).toBe(false)
  expect(sendResponse.data.payment).toMatchObject({
    recipient_email: "dev@example.com",
    amount_cents: 1250,
    currency: "USD",
    status: "pending",
    idempotency_key: "issue-1-pr-22",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })

  const replayResponse = await axios.post("/payments/send", {
    recipient_email: "dev@example.com",
    amount_cents: 1250,
    currency: "USD",
    idempotency_key: "issue-1-pr-22",
  })

  expect(replayResponse.data.idempotent_replay).toBe(true)
  expect(replayResponse.data.payment.payment_id).toBe(
    sendResponse.data.payment.payment_id,
  )

  const pendingListResponse = await axios.get(
    "/payments/list?status=pending&repository=tscircuit/fake-algora",
  )

  expect(pendingListResponse.data.payments).toHaveLength(1)

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: sendResponse.data.payment.payment_id,
  })

  expect(completeResponse.data.payment.status).toBe("completed")

  const getResponse = await axios.get(
    `/payments/get?payment_id=${sendResponse.data.payment.payment_id}`,
  )

  expect(getResponse.data.payment.status).toBe("completed")
})
