import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, and complete a payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty_123",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.ok).toBe(true)
  expect(sendData.payment.payment_id.startsWith("pay_")).toBe(true)
  expect(sendData.payment.status).toBe("pending")
  expect(sendData.payment.amount).toBe(10)

  const { data: listData } = await axios.get(
    "/payments/list?repository=tscircuit/fake-algora&status=pending",
  )

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe(sendData.payment.payment_id)

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.ok).toBe(true)
  expect(completeData.payment.status).toBe("completed")
})

test("send payment is idempotent when an idempotency key is supplied", async () => {
  const { axios } = await getTestServer()
  const paymentRequest = {
    recipient: "contributor@example.com",
    amount: 25,
    idempotency_key: "retry-safe-key",
  }

  const { data: firstSendData } = await axios.post(
    "/payments/send",
    paymentRequest,
  )
  const { data: secondSendData } = await axios.post(
    "/payments/send",
    paymentRequest,
  )
  const { data: listData } = await axios.get("/payments/list")

  expect(secondSendData.payment.payment_id).toBe(
    firstSendData.payment.payment_id,
  )
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].currency).toBe("USD")
})

test("terminal payments cannot be canceled", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 5,
  })

  await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: sendData.payment.payment_id,
  })

  expect(cancelData.ok).toBe(false)
  expect(cancelData.error).toBe("Only pending payments can cancel")
})
