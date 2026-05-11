import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and complete a payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    owner: "tscircuit",
    repo: "fake-algora",
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
    owner: "tscircuit",
    repo: "fake-algora",
    bounty_id: "bounty_123",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-payment",
  })
  expect(sendData.idempotent).toBe(false)

  const { data: duplicateData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    idempotency_key: "retry-safe-payment",
  })

  expect(duplicateData.payment.payment_id).toBe("0")
  expect(duplicateData.idempotent).toBe(true)

  const { data: listData } = await axios.get("/payments/list", {
    params: {
      recipient: "maintainer@example.com",
      status: "pending",
      owner: "tscircuit",
      repo: "fake-algora",
      repository: "tscircuit/fake-algora",
      bounty_id: "bounty_123",
      issue_number: 1,
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

test("cancel and fail update payment status", async () => {
  const { axios } = await getTestServer()

  const { data: cancelSource } = await axios.post("/payments/send", {
    recipient: "first@example.com",
    amount: 20,
  })

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: cancelSource.payment.payment_id,
    cancel_reason: "duplicate bounty claim",
  })

  expect(cancelData.payment.status).toBe("canceled")
  expect(cancelData.payment.cancel_reason).toBe("duplicate bounty claim")
  expect(cancelData.payment.canceled_at).toBeString()

  const { data: failSource } = await axios.post("/payments/send", {
    recipient: "second@example.com",
    amount: 30,
  })

  const { data: failData } = await axios.post("/payments/fail", {
    payment_id: failSource.payment.payment_id,
    failure_reason: "recipient missing payout details",
  })

  expect(failData.payment.status).toBe("failed")
  expect(failData.payment.failure_reason).toBe(
    "recipient missing payout details",
  )
  expect(failData.payment.failed_at).toBeString()
})

test("missing payments return null", async () => {
  const { axios } = await getTestServer()

  const { data: getData } = await axios.get("/payments/get", {
    params: { payment_id: "missing" },
  })
  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: "missing",
  })
  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: "missing",
  })

  expect(getData.payment).toBeNull()
  expect(completeData.payment).toBeNull()
  expect(cancelData.payment).toBeNull()
})
