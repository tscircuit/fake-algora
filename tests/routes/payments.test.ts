import { expect, it } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

it("POST /payments/send creates a pending payment", async () => {
  const { axios } = await getTestServer()

  const res = await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 1250,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    idempotency_key: "claim-1-payment",
  })

  expect(res.status).toBe(200)
  expect(res.data.payment).toMatchObject({
    recipient: "alice@example.com",
    amount: 1250,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    idempotency_key: "claim-1-payment",
    status: "pending",
  })
  expect(res.data.payment.payment_id).toBeTruthy()
  expect(res.data.payment.created_at).toBeTruthy()
})

it("POST /payments/send returns the existing payment for the same idempotency key", async () => {
  const { axios } = await getTestServer()

  const firstRes = await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 1250,
    idempotency_key: "same-payment",
  })
  const secondRes = await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 1250,
    idempotency_key: "same-payment",
  })

  expect(secondRes.data.payment.payment_id).toBe(
    firstRes.data.payment.payment_id,
  )
})

it("GET /payments/list filters payments by status and repository", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 1250,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount: 500,
    repository: "tscircuit/other",
  })

  const res = await axios.get(
    "/payments/list?status=pending&repository=tscircuit/fake-algora",
  )

  expect(res.status).toBe(200)
  expect(res.data.payments).toHaveLength(1)
  expect(res.data.payments[0]).toMatchObject({
    recipient: "alice@example.com",
    repository: "tscircuit/fake-algora",
    status: "pending",
  })
})

it("POST /payments/complete marks a pending payment as completed", async () => {
  const { axios } = await getTestServer()

  const sendRes = await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 1250,
  })
  const paymentId = sendRes.data.payment.payment_id

  const completeRes = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })

  expect(completeRes.status).toBe(200)
  expect(completeRes.data.payment).toMatchObject({
    payment_id: paymentId,
    status: "completed",
  })
  expect(completeRes.data.payment.completed_at).toBeTruthy()
})
