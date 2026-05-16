import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("send a payment", async () => {
  const { axios } = await getTestServer()

  const res = await axios.post("/payments/send", {
    amount: 42.50,
    currency: "USD",
    recipient: "alice@example.com",
    description: "Test payment",
  })

  expect(res.status).toBe(200)
  expect(res.data.ok).toBe(true)
  expect(res.data.payment_id).toBeDefined()
  expect(res.data.payment_id).toMatch(/^pay_/)
})

test("send payment with default currency", async () => {
  const { axios } = await getTestServer()

  const res = await axios.post("/payments/send", {
    amount: 10,
    recipient: "bob@example.com",
    description: "Coffee",
  })

  expect(res.status).toBe(200)
  expect(res.data.ok).toBe(true)
  expect(res.data.payment_id).toBeDefined()
})

test("send and list payments", async () => {
  const { axios } = await getTestServer()

  // Send two payments
  await axios.post("/payments/send", {
    amount: 25,
    recipient: "carol@example.com",
    description: "First payment",
  })

  await axios.post("/payments/send", {
    amount: 15.99,
    currency: "EUR",
    recipient: "dave@example.com",
    description: "Second payment",
  })

  // List payments
  const { data } = await axios.get("/payments/list")

  expect(data.payments).toHaveLength(2)
  expect(data.payments[0].amount).toBe(25)
  expect(data.payments[0].recipient).toBe("carol@example.com")
  expect(data.payments[0].currency).toBe("USD")
  expect(data.payments[1].amount).toBe(15.99)
  expect(data.payments[1].currency).toBe("EUR")
  expect(data.payments[1].recipient).toBe("dave@example.com")
})

test("send payment with invalid amount", async () => {
  const { axios } = await getTestServer()

  try {
    await axios.post("/payments/send", {
      amount: -10,
      recipient: "eve@example.com",
      description: "Negative amount",
    })
    // Should not reach here
    expect(true).toBe(false)
  } catch (err: any) {
    expect(err.response.status).toBe(400)
  }
})

test("send payment with missing recipient", async () => {
  const { axios } = await getTestServer()

  try {
    await axios.post("/payments/send", {
      amount: 50,
      description: "Missing recipient",
    })
    // Should not reach here
    expect(true).toBe(false)
  } catch (err: any) {
    expect(err.response.status).toBe(400)
  }
})
