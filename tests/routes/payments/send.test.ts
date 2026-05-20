import { test, expect } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "worker@example.com",
    amount_cents: 1000,
    memo: "Bounty payout",
  })

  expect(data.ok).toBe(true)
  expect(data.payment).toMatchObject({
    payment_id: "0",
    recipient: "worker@example.com",
    amount_cents: 1000,
    currency: "USD",
    memo: "Bounty payout",
    status: "sent",
  })
  expect(typeof data.payment.created_at).toBe("string")

  const listRes = await axios.get("/payments/list")

  expect(listRes.data.payments).toHaveLength(1)
  expect(listRes.data.payments[0]).toMatchObject({
    payment_id: "0",
    recipient: "worker@example.com",
    amount_cents: 1000,
    currency: "USD",
    status: "sent",
  })
})
