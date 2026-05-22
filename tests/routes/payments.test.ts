import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

const paymentRequest = {
  recipient: "octocat",
  amount: 10,
  repository: "tscircuit/fake-algora",
  issue_number: 1,
  bounty_id: "fake-algora-1",
}

test("send and list fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", paymentRequest)

  expect(sendData.replayed).toBe(false)
  expect(sendData.payment).toMatchObject({
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "fake-algora-1",
    status: "pending",
  })
  expect(typeof sendData.payment.payment_id).toBe("string")
  expect(typeof sendData.payment.created_at).toBe("string")

  const { data: listData } = await axios.get("/payments/list")

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe(sendData.payment.payment_id)
})

test("idempotency key replays the original fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: firstSend } = await axios.post("/payments/send", {
    ...paymentRequest,
    idempotency_key: "send-once",
  })
  const { data: replayedSend } = await axios.post("/payments/send", {
    ...paymentRequest,
    amount: 25,
    idempotency_key: "send-once",
  })

  expect(firstSend.replayed).toBe(false)
  expect(replayedSend.replayed).toBe(true)
  expect(replayedSend.payment.payment_id).toBe(firstSend.payment.payment_id)
  expect(replayedSend.payment.amount).toBe(10)

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
})

test("get and complete a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", paymentRequest)
  const paymentId = sendData.payment.payment_id

  const { data: getData } = await axios.get(
    `/payments/get?payment_id=${paymentId}`,
  )
  expect(getData.payment.payment_id).toBe(paymentId)

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })

  expect(completeData.payment).toMatchObject({
    payment_id: paymentId,
    status: "completed",
  })
  expect(typeof completeData.payment.completed_at).toBe("string")
})

test("list filters payments and prevents changing terminal payments", async () => {
  const { axios, url } = await getTestServer()

  const { data: firstSend } = await axios.post("/payments/send", paymentRequest)
  await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 5,
    currency: "eur",
    repository: "tscircuit/other",
    issue_number: 2,
  })
  await axios.post("/payments/complete", {
    payment_id: firstSend.payment.payment_id,
  })

  const { data: completedPayments } = await axios.get(
    "/payments/list?status=completed&repository=tscircuit/fake-algora",
  )
  expect(completedPayments.payments).toHaveLength(1)
  expect(completedPayments.payments[0].payment_id).toBe(
    firstSend.payment.payment_id,
  )

  const cancelResponse = await fetch(`${url}/payments/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_id: firstSend.payment.payment_id }),
  })
  expect(cancelResponse.status).toBe(409)
  expect(await cancelResponse.json()).toEqual({
    error: "Payment is already completed",
  })
})
