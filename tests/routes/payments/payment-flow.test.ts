import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, read, list, and update a fake payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_issue: "tscircuit/fake-algora#1",
    idempotency_key: "claim-1-pr-1",
  })

  expect(sendResponse.status).toBe(200)
  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "0",
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_issue: "tscircuit/fake-algora#1",
    status: "pending",
    idempotency_key: "claim-1-pr-1",
  })

  const replayResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_issue: "tscircuit/fake-algora#1",
    idempotency_key: "claim-1-pr-1",
  })

  expect(replayResponse.data.payment.payment_id).toBe("0")

  const getResponse = await axios.get("/payments/get?payment_id=0")
  expect(getResponse.data.payment.status).toBe("pending")

  const completeResponse = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })
  expect(completeResponse.data.payment).toMatchObject({
    payment_id: "0",
    status: "completed",
  })

  const listResponse = await axios.get("/payments/list?status=completed")
  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].payment_id).toBe("0")
})

test("missing fake payments return a 404", async () => {
  const { axios } = await getTestServer()

  const response = await axios.get("/payments/get?payment_id=missing", {
    validateStatus: () => true,
  })

  expect(response.status).toBe(404)
  expect(response.data).toEqual({ error: "Payment not found" })
})
