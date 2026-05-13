import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "github:user",
    amount_cents: 500,
    currency: "usd",
    memo: "Test bounty payout",
  })

  expect(data.payment).toMatchObject({
    payment_id: "0",
    recipient: "github:user",
    amount_cents: 500,
    currency: "USD",
    memo: "Test bounty payout",
    status: "sent",
  })

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("deduplicates payments by idempotency key", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "github:user",
    amount_cents: 1000,
    currency: "USD",
    idempotency_key: "github-issue-1",
  }

  const firstResponse = await axios.post("/payments/send", payload)
  const secondResponse = await axios.post("/payments/send", payload)

  expect(secondResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("defaults payment currency to USD", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "github:user",
    amount_cents: 500,
  })

  expect(data.payment.currency).toBe("USD")
})

test("get a payment by id", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "github:user",
    amount_cents: 750,
    currency: "USD",
  })

  const { data } = await axios.get("/payments/get", {
    params: { payment_id: "0" },
  })

  expect(data.payment).toMatchObject({
    payment_id: "0",
    amount_cents: 750,
  })
})

test("updates a payment status", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "github:user",
    amount_cents: 500,
    currency: "USD",
  })

  const { data } = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })

  expect(data.payment).toMatchObject({
    payment_id: "0",
    status: "completed",
  })

  const getResponse = await axios.get("/payments/get", {
    params: { payment_id: "0" },
  })
  expect(getResponse.data.payment.status).toBe("completed")
})

test("returns null when updating a missing payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/update-status", {
    payment_id: "missing",
    status: "failed",
  })

  expect(data.payment).toBeNull()
})
