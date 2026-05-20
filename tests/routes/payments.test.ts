import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post(
    "/payments/send",
    {
      recipient: "contributor@example.com",
      amount: 10,
      currency: "usd",
      repository: "tscircuit/fake-algora",
      issue_number: 1,
      bounty_id: "bounty_1",
    },
    {
      headers: {
        "idempotency-key": "reward-pr-123",
      },
    },
  )

  expect(sendData.idempotent_replay).toBe(false)
  expect(sendData.payment).toMatchObject({
    payment_id: "pay_0",
    recipient: "contributor@example.com",
    amount: 10,
    currency: "USD",
    status: "pending",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "bounty_1",
    idempotency_key: "reward-pr-123",
  })

  const { data: listData } = await axios.get(
    "/payments/list?status=pending&repository=tscircuit%2Ffake-algora",
  )
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe("pay_0")

  const { data: getData } = await axios.get("/payments/get?payment_id=pay_0")
  expect(getData.payment.payment_id).toBe("pay_0")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })
  expect(completeData.ok).toBe(true)
  expect(completeData.payment.status).toBe("completed")
})

test("send is idempotent when the same idempotency key is reused", async () => {
  const { axios } = await getTestServer()

  const first = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
    idempotency_key: "same-pr",
  })

  const replay = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
    idempotency_key: "same-pr",
  })

  const { data: listData } = await axios.get("/payments/list")

  expect(first.data.idempotent_replay).toBe(false)
  expect(replay.data.idempotent_replay).toBe(true)
  expect(replay.data.payment.payment_id).toBe(first.data.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("cancel refuses terminal payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
  })
  await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: "pay_0",
  })

  expect(cancelData.ok).toBe(false)
  expect(cancelData.payment.status).toBe("completed")
  expect(cancelData.error).toBe("Cannot cancel a completed payment")
})
