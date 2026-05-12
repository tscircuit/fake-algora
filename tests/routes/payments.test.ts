import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends and lists fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sent } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "fake-algora-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    note: "Bounty payout",
  })

  expect(sent.idempotent_replay).toBe(false)
  expect(sent.payment).toMatchObject({
    payment_id: "0",
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "fake-algora-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const { data: listed } = await axios.get(
    "/payments/list?recipient=octocat&status=pending",
  )

  expect(listed.payments).toHaveLength(1)
  expect(listed.payments[0].payment_id).toBe("0")
})

test("reuses payment for matching idempotency key", async () => {
  const { axios } = await getTestServer()

  const requestBody = {
    recipient: "retry-safe-user",
    amount: 5,
    idempotency_key: "retry-key-1",
  }

  const { data: first } = await axios.post("/payments/send", requestBody)
  const { data: second } = await axios.post("/payments/send", requestBody)
  const { data: listed } = await axios.get("/payments/list")

  expect(first.idempotent_replay).toBe(false)
  expect(second.idempotent_replay).toBe(true)
  expect(second.payment.payment_id).toBe(first.payment.payment_id)
  expect(listed.payments).toHaveLength(1)
})

test("gets and transitions payment status", async () => {
  const { axios } = await getTestServer()

  const { data: sent } = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 12,
  })

  const { data: fetched } = await axios.get(
    `/payments/get?payment_id=${sent.payment.payment_id}`,
  )

  expect(fetched.payment.status).toBe("pending")

  const { data: completed } = await axios.post("/payments/complete", {
    payment_id: sent.payment.payment_id,
  })

  expect(completed.payment.status).toBe("completed")
  expect(typeof completed.payment.completed_at).toBe("string")
})
