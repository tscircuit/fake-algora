import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and complete a payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    bounty_id: "bounty_123",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })

  expect(sendData.payment).toMatchObject({
    payment_id: "0",
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty_123",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })

  const { data: duplicateData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    idempotency_key: "retry-safe-payment",
  })

  expect(duplicateData.payment.payment_id).toBe("0")

  const { data: listData } = await axios.get("/payments/list", {
    params: {
      recipient: "maintainer@example.com",
      status: "pending",
    },
  })

  expect(listData.payments).toHaveLength(1)

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: "0",
  })

  expect(completeData.payment.status).toBe("completed")
  expect(completeData.payment.completed_at).toBeString()

  const { data: getData } = await axios.get("/payments/get", {
    params: {
      payment_id: "0",
    },
  })

  expect(getData.payment.status).toBe("completed")
})
