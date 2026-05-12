import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and list payments", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 10,
    memo: "Bounty payout",
  })

  expect(sendResponse.status).toBe(200)
  expect(sendResponse.data.ok).toBe(true)
  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "0",
    recipient: "maintainer@example.com",
    amount_usd: 10,
    memo: "Bounty payout",
    status: "sent",
  })
  expect(typeof sendResponse.data.payment.created_at).toBe("string")

  const listResponse = await axios.get("/payments/list")

  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0]).toEqual(sendResponse.data.payment)
})
