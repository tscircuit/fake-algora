import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, and get payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.payment).toMatchObject({
    payment_id: "0",
    recipient: "alice@example.com",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const { data: listData } = await axios.get(
    "/payments/list?recipient=alice@example.com&status=pending",
  )
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe("0")

  const { data: getData } = await axios.get("/payments/get?payment_id=0")
  expect(getData.payment.recipient).toBe("alice@example.com")
})

test("idempotency keys replay the original payment", async () => {
  const { axios } = await getTestServer()

  const first = await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount: 25,
    idempotency_key: "request-1",
  })
  const second = await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount: 25,
    idempotency_key: "request-1",
  })

  expect(second.data.payment.payment_id).toBe(first.data.payment.payment_id)

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
})

test("status updates only apply to pending payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "carol@example.com",
    amount: 5,
  })

  const completed = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })
  expect(completed.data.payment.status).toBe("completed")

  const canceled = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "canceled",
  })
  expect(canceled.data.payment.status).toBe("completed")
})
