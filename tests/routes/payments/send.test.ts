import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment and list it", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 16.88,
    memo: "Bounty reward",
  })

  expect(sendData.ok).toBe(true)
  expect(sendData.idempotent_replay).toBe(false)
  expect(sendData.payment.payment_id).toBe("pay_0")
  expect(sendData.payment.recipient).toBe("maintainer@example.com")
  expect(sendData.payment.amount_usd).toBe(16.88)
  expect(sendData.payment.status).toBe("sent")
  expect(sendData.payment.sent_at).toBeDefined()

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0]).toMatchObject({
    payment_id: sendData.payment.payment_id,
    recipient: "maintainer@example.com",
    amount_usd: 16.88,
    status: "sent",
  })
})

test("replays payment requests with the same idempotency key", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 25,
    idempotency_key: "claim-1",
  })

  const secondResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 25,
    idempotency_key: "claim-1",
  })

  expect(secondResponse.data.idempotent_replay).toBe(true)
  expect(secondResponse.data.payment).toEqual(firstResponse.data.payment)

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
})

test("filters listed payments by recipient", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount_usd: 10,
  })
  await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount_usd: 20,
  })

  const { data } = await axios.get(
    "/payments/list?recipient=alice%40example.com",
  )

  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].recipient).toBe("alice@example.com")
})
