import { expect, it } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

it("sends and replays fake payments with an idempotency key", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "maintainer@example.com",
    amount: 1250,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    bounty_issue: "https://github.com/tscircuit/fake-algora/issues/1",
    idempotency_key: "retry-safe-payment-1",
  }

  const firstSend = await axios.post("/payments/send", payload)

  expect(firstSend.status).toBe(200)
  expect(firstSend.data.idempotent_replay).toBe(false)
  expect(firstSend.data.payment).toMatchObject({
    payment_id: "payment_0",
    recipient: payload.recipient,
    amount: payload.amount,
    currency: payload.currency,
    repository: payload.repository,
    bounty_issue: payload.bounty_issue,
    status: "pending",
  })
  expect(firstSend.data.payment.created_at).toBeString()
  expect(firstSend.data.payment.updated_at).toBeString()

  const replay = await axios.post("/payments/send", payload)

  expect(replay.status).toBe(200)
  expect(replay.data.idempotent_replay).toBe(true)
  expect(replay.data.payment.payment_id).toBe("payment_0")

  const lookup = await axios.get("/payments/get?payment_id=payment_0")

  expect(lookup.status).toBe(200)
  expect(lookup.data.payment).toMatchObject({
    payment_id: "payment_0",
    recipient: payload.recipient,
    amount: payload.amount,
    status: "pending",
  })

  const list = await axios.get(
    "/payments/list?recipient=maintainer@example.com&status=pending",
  )

  expect(list.status).toBe(200)
  expect(list.data.payments).toHaveLength(1)
  expect(list.data.payments[0].payment_id).toBe("payment_0")
})

it("updates fake payment status once it is sent", async () => {
  const { axios } = await getTestServer()

  const send = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 500,
    currency: "USD",
    repository: "tscircuit/fake-algora",
  })

  const update = await axios.post("/payments/update-status", {
    payment_id: send.data.payment.payment_id,
    status: "completed",
  })

  expect(update.status).toBe(200)
  expect(update.data.payment).toMatchObject({
    payment_id: send.data.payment.payment_id,
    status: "completed",
  })

  const list = await axios.get("/payments/list?status=completed")

  expect(list.status).toBe(200)
  expect(list.data.payments).toHaveLength(1)
  expect(list.data.payments[0].status).toBe("completed")
})
