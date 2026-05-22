import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 10,
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendResponse.data.idempotent_replay).toBe(false)
  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "pay_0",
    recipient: "dev@example.com",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const listResponse = await axios.get(
    "/payments/list?recipient=dev%40example.com&status=pending",
  )

  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].payment_id).toBe("pay_0")

  const getResponse = await axios.get("/payments/get?payment_id=pay_0")
  expect(getResponse.data.payment.payment_id).toBe("pay_0")

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })

  expect(completeResponse.data.ok).toBe(true)
  expect(completeResponse.data.payment.status).toBe("completed")
})

test("send replays existing payment for matching idempotency key", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 5,
    idempotency_key: "retry-safe-key",
  })

  const secondResponse = await axios.post("/payments/send", {
    recipient: "dev@example.com",
    amount: 5,
    idempotency_key: "retry-safe-key",
  })

  expect(firstResponse.data.idempotent_replay).toBe(false)
  expect(secondResponse.data.idempotent_replay).toBe(true)
  expect(secondResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})
