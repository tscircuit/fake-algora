import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends and stores a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "github:octocat",
    amount_cents: 1000,
    currency: "usd",
    memo: "Bounty payout",
  })

  expect(data).toMatchObject({
    idempotent_replay: false,
    payment: {
      payment_id: "0",
      recipient: "github:octocat",
      amount_cents: 1000,
      currency: "USD",
      memo: "Bounty payout",
      status: "sent",
    },
  })

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("defaults payment currency to USD", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "github:octocat",
    amount_cents: 250,
  })

  expect(data.payment.currency).toBe("USD")
})

test("deduplicates retries by idempotency key", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "github:octocat",
    amount_cents: 1500,
    idempotency_key: "issue-1-octocat",
  }

  const firstResponse = await axios.post("/payments/send", payload)
  const secondResponse = await axios.post("/payments/send", payload)

  expect(secondResponse.data).toMatchObject({
    idempotent_replay: true,
    payment: {
      payment_id: firstResponse.data.payment.payment_id,
      idempotency_key: "issue-1-octocat",
    },
  })

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("gets and filters payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "github:octocat",
    amount_cents: 500,
  })
  await axios.post("/payments/send", {
    recipient: "github:hubot",
    amount_cents: 750,
  })

  const getResponse = await axios.get("/payments/get", {
    params: { payment_id: "1" },
  })
  expect(getResponse.data.payment).toMatchObject({
    payment_id: "1",
    recipient: "github:hubot",
  })

  const filterResponse = await axios.get("/payments/list", {
    params: { recipient: "github:octocat" },
  })
  expect(filterResponse.data.payments).toHaveLength(1)
  expect(filterResponse.data.payments[0].recipient).toBe("github:octocat")
})

test("completes and cancels payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "github:octocat",
    amount_cents: 500,
  })
  await axios.post("/payments/send", {
    recipient: "github:hubot",
    amount_cents: 750,
  })

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "0",
  })
  expect(completeResponse.data.payment).toMatchObject({
    payment_id: "0",
    status: "completed",
  })
  expect(completeResponse.data.payment.completed_at).toBeTruthy()

  const cancelResponse = await axios.post("/payments/cancel", {
    payment_id: "1",
  })
  expect(cancelResponse.data.payment).toMatchObject({
    payment_id: "1",
    status: "canceled",
  })

  const completedPayments = await axios.get("/payments/list", {
    params: { status: "completed" },
  })
  expect(completedPayments.data.payments).toHaveLength(1)
})
