import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("create a payment with all fields", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/create", {
    recipient: "user123",
    amount: 100,
    currency: "USD",
    bounty_id: "bounty_456",
    issue_number: 42,
    repository: "tscircuit/test-repo",
  })

  expect(data.payment).toBeDefined()
  expect(data.payment.payment_id).toMatch(/^pay_/)
  expect(data.payment.recipient).toBe("user123")
  expect(data.payment.amount).toBe(100)
  expect(data.payment.currency).toBe("USD")
  expect(data.payment.status).toBe("pending")
  expect(data.payment.bounty_id).toBe("bounty_456")
  expect(data.payment.issue_number).toBe(42)
  expect(data.payment.repository).toBe("tscircuit/test-repo")
  expect(data.payment.created_at).toBeDefined()
})

test("create a payment with minimal fields", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/create", {
    recipient: "user456",
    amount: 50,
  })

  expect(data.payment).toBeDefined()
  expect(data.payment.recipient).toBe("user456")
  expect(data.payment.amount).toBe(50)
  expect(data.payment.currency).toBe("USD")
  expect(data.payment.status).toBe("pending")
})