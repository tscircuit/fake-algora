import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("creates and reads a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 10,
    bounty_id: "bounty_1",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })

  expect(sendData.idempotent_replay).toBe(false)
  expect(sendData.payment).toMatchObject({
    payment_id: "pay_0",
    recipient: "maintainer@example.com",
    amount_usd: 10,
    status: "pending",
    bounty_id: "bounty_1",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })
  expect(sendData.payment.created_at).toBeString()

  const { data: getData } = await axios.get("/payments/get", {
    params: { payment_id: "pay_0" },
  })

  expect(getData.payment).toEqual(sendData.payment)
})

test("reuses a payment when an idempotency key is repeated", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 10,
    idempotency_key: "claim-1",
  })

  const secondResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount_usd: 10,
    idempotency_key: "claim-1",
  })

  expect(firstResponse.data.idempotent_replay).toBe(false)
  expect(secondResponse.data.idempotent_replay).toBe(true)
  expect(secondResponse.data.payment).toEqual(firstResponse.data.payment)

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
})

test("filters payments and updates lifecycle status", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "one@example.com",
    amount_usd: 10,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient: "two@example.com",
    amount_usd: 20,
    repository: "tscircuit/other",
  })

  const { data: filteredByRecipient } = await axios.get("/payments/list", {
    params: { recipient: "one@example.com" },
  })
  expect(filteredByRecipient.payments).toHaveLength(1)
  expect(filteredByRecipient.payments[0].payment_id).toBe("pay_0")

  const { data: filteredByRepository } = await axios.get("/payments/list", {
    params: { repository: "tscircuit/other" },
  })
  expect(filteredByRepository.payments).toHaveLength(1)
  expect(filteredByRepository.payments[0].payment_id).toBe("pay_1")

  const { data: completedData } = await axios.post("/payments/complete", {
    payment_id: "pay_0",
  })
  expect(completedData.payment.status).toBe("completed")
  expect(completedData.payment.completed_at).toBeString()

  const { data: canceledData } = await axios.post("/payments/cancel", {
    payment_id: "pay_1",
  })
  expect(canceledData.payment.status).toBe("canceled")
  expect(canceledData.payment.canceled_at).toBeString()

  const { data: completedList } = await axios.get("/payments/list", {
    params: { status: "completed" },
  })
  expect(completedList.payments).toHaveLength(1)
  expect(completedList.payments[0].payment_id).toBe("pay_0")
})
