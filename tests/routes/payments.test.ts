import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a fake payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_usd: 10.5,
    bounty_issue_url: "https://github.com/tscircuit/fake-algora/issues/1",
    idempotency_key: "issue-1-solver@example.com",
  })

  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "0",
    recipient_email: "solver@example.com",
    amount_cents: 1050,
    currency: "usd",
    status: "sent",
    bounty_issue_url: "https://github.com/tscircuit/fake-algora/issues/1",
  })

  const replayResponse = await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_usd: 10.5,
    idempotency_key: "issue-1-solver@example.com",
  })

  expect(replayResponse.data.payment.payment_id).toBe("0")

  const listResponse = await axios.get(
    "/payments/list?recipient_email=solver@example.com",
  )
  expect(listResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.get("/payments/get?payment_id=0")
  expect(getResponse.data.payment.recipient_email).toBe("solver@example.com")

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "0",
  })
  expect(completeResponse.data.payment.status).toBe("completed")

  const cancelAfterCompleteResponse = await axios.post("/payments/cancel", {
    payment_id: "0",
  })
  expect(cancelAfterCompleteResponse.data.payment.status).toBe("completed")
})
