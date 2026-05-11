import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends and completes a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "fake-algora-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.payment.payment_id).toBe("0")
  expect(sendData.payment.status).toBe("pending")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("completed")

  const { data: getData } = await axios.get("/payments/get", {
    params: { payment_id: sendData.payment.payment_id },
  })

  expect(getData.payment.status).toBe("completed")
})

test("does not duplicate payments when an idempotency key is reused", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "contributor@example.com",
    amount: 20,
    currency: "USD",
    idempotency_key: "retry-safe-key",
  }

  const { data: firstSend } = await axios.post("/payments/send", payload)
  const { data: secondSend } = await axios.post("/payments/send", payload)
  const { data: listData } = await axios.get("/payments/list")

  expect(firstSend.payment.payment_id).toBe(secondSend.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("filters listed payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "first@example.com",
    amount: 10,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient: "second@example.com",
    amount: 15,
    repository: "tscircuit/other",
  })

  const { data } = await axios.get("/payments/list", {
    params: { repository: "tscircuit/fake-algora" },
  })

  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].recipient).toBe("first@example.com")
})
