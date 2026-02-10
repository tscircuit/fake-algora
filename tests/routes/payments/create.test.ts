import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("create a payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/create", {
    recipient: "user123",
    amount: 100,
    currency: "USD",
    bounty_id: "bounty_456",
    issue_number: 123,
    repository: "tscircuit/test-repo",
  })

  expect(data.payment).toBeDefined()
  expect(data.payment.recipient).toBe("user123")
  expect(data.payment.amount).toBe(100)
  expect(data.payment.status).toBe("pending")
  expect(data.payment.payment_id).toContain("pay_")
})

test("create payment with minimal fields", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/create", {
    recipient: "user456",
    amount: 50,
  })

  expect(data.payment).toBeDefined()
  expect(data.payment.recipient).toBe("user456")
  expect(data.payment.amount).toBe(50)
  expect(data.payment.currency).toBe("USD")
})
