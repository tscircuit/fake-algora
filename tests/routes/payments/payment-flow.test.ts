import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends, replays, lists, fetches, and completes fake payments", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount_cents: 500,
    idempotency_key: "issue-1-octocat",
    bounty_issue: "tscircuit/fake-algora#1",
    memo: "fake bounty payout",
  })

  expect(sendResponse.data.idempotent_replay).toBe(false)
  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "pay_0",
    recipient: "octocat",
    amount_cents: 500,
    currency: "USD",
    status: "pending",
    idempotency_key: "issue-1-octocat",
    bounty_issue: "tscircuit/fake-algora#1",
  })

  const replayResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount_cents: 500,
    idempotency_key: "issue-1-octocat",
  })

  expect(replayResponse.data.idempotent_replay).toBe(true)
  expect(replayResponse.data.payment.payment_id).toBe(
    sendResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get(
    "/payments/list?recipient=octocat&status=pending",
  )

  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].payment_id).toBe("pay_0")

  const getResponse = await axios.get("/payments/get?payment_id=pay_0")

  expect(getResponse.data.payment.payment_id).toBe("pay_0")

  const completeResponse = await axios.post("/payments/update-status", {
    payment_id: "pay_0",
    status: "completed",
  })

  expect(completeResponse.data.payment).toMatchObject({
    payment_id: "pay_0",
    status: "completed",
  })

  const completedListResponse = await axios.get(
    "/payments/list?status=completed",
  )

  expect(completedListResponse.data.payments).toHaveLength(1)
})
