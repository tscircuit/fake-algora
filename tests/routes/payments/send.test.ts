import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("send and list payments", async () => {
  const { axios } = await getTestServer()

  const { data: payment } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    bounty_issue: 1,
  })

  expect(payment).toMatchObject({
    payment_id: "payment_0",
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    bounty_issue: 1,
    status: "sent",
  })

  const { data } = await axios.get("/payments/list")
  expect(data.payments).toHaveLength(1)
  expect(data.payments[0]).toEqual(payment)
})
