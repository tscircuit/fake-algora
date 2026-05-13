import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and update fake payments", async () => {
  const { axios } = await getTestServer()

  const first = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "tscircuit/fake-algora#1",
    idempotency_key: "bounty-1-payment",
  })

  expect(first.data.payment.payment_id).toBe("0")
  expect(first.data.payment.status).toBe("pending")
  expect(first.data.idempotent).toBe(false)

  const retry = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "tscircuit/fake-algora#1",
    idempotency_key: "bounty-1-payment",
  })

  expect(retry.data.payment.payment_id).toBe(first.data.payment.payment_id)
  expect(retry.data.idempotent).toBe(true)

  const list = await axios.get("/payments/list?status=pending")
  expect(list.data.payments).toHaveLength(1)

  const get = await axios.get("/payments/get?payment_id=0")
  expect(get.data.payment.recipient).toBe("maintainer@example.com")

  const updated = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })
  expect(updated.data.payment.status).toBe("completed")
})
