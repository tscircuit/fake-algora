import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("POST /payments/send creates a pending payment", async () => {
  const { axios } = await getTestServer()
  const { data } = await axios.post("/payments/send", {
    recipient: "alice",
    amount: 100,
    bounty_id: "algora-12345",
    issue_number: 42,
    repository: "example/repo",
  })
  expect(data.payment.recipient).toBe("alice")
  expect(data.payment.amount).toBe(100)
  expect(data.payment.currency).toBe("USD")
  expect(data.payment.status).toBe("pending")
  expect(data.payment.bounty_id).toBe("algora-12345")
})

test("POST /payments/send with idempotency_key dedupes retries", async () => {
  const { axios } = await getTestServer()
  const body = {
    recipient: "bob",
    amount: 50,
    idempotency_key: "retry-once",
  }
  const a = await axios.post("/payments/send", body)
  const b = await axios.post("/payments/send", body)
  expect(a.data.payment.payment_id).toBe(b.data.payment.payment_id)

  const list = await axios.get("/payments/list", { params: { recipient: "bob" } })
  expect(list.data.payments).toHaveLength(1)
})

test("GET /payments/get returns the payment", async () => {
  const { axios } = await getTestServer()
  const { data: created } = await axios.post("/payments/send", {
    recipient: "carol",
    amount: 25,
  })
  const { data: fetched } = await axios.get("/payments/get", {
    params: { payment_id: created.payment.payment_id },
  })
  expect(fetched.payment.payment_id).toBe(created.payment.payment_id)
  expect(fetched.payment.recipient).toBe("carol")
})

test("GET /payments/get returns { payment: null } for unknown id", async () => {
  const { axios } = await getTestServer()
  const { data } = await axios.get("/payments/get", {
    params: { payment_id: "does-not-exist" },
  })
  expect(data.payment).toBeNull()
})

test("POST /payments/complete moves pending → completed", async () => {
  const { axios } = await getTestServer()
  const { data: created } = await axios.post("/payments/send", {
    recipient: "dave",
    amount: 75,
  })
  const { data: completed } = await axios.post("/payments/complete", {
    payment_id: created.payment.payment_id,
  })
  expect(completed.payment.status).toBe("completed")
})

test("POST /payments/cancel moves pending → canceled", async () => {
  const { axios } = await getTestServer()
  const { data: created } = await axios.post("/payments/send", {
    recipient: "eve",
    amount: 25,
  })
  const { data: canceled } = await axios.post("/payments/cancel", {
    payment_id: created.payment.payment_id,
  })
  expect(canceled.payment.status).toBe("canceled")
})

test("completed payments stay completed (terminal state)", async () => {
  const { axios } = await getTestServer()
  const { data: created } = await axios.post("/payments/send", {
    recipient: "frank",
    amount: 10,
  })
  await axios.post("/payments/complete", {
    payment_id: created.payment.payment_id,
  })
  // Try to cancel — should be a no-op since payment is terminal.
  const { data: canceled } = await axios.post("/payments/cancel", {
    payment_id: created.payment.payment_id,
  })
  expect(canceled.payment.status).toBe("completed")
})

test("GET /payments/list filters by status", async () => {
  const { axios } = await getTestServer()
  const { data: p1 } = await axios.post("/payments/send", {
    recipient: "g",
    amount: 1,
  })
  await axios.post("/payments/send", { recipient: "h", amount: 2 })
  await axios.post("/payments/complete", { payment_id: p1.payment.payment_id })

  const pending = await axios.get("/payments/list", {
    params: { status: "pending" },
  })
  const completed = await axios.get("/payments/list", {
    params: { status: "completed" },
  })
  expect(pending.data.payments).toHaveLength(1)
  expect(completed.data.payments).toHaveLength(1)
})
