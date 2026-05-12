import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send payment is idempotent and queryable", async () => {
  const { axios } = await getTestServer()

  const paymentRequest = {
    recipient: "richboyneedcash",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "fake-algora-1",
    idempotency_key: "issue-1-richboyneedcash",
  }

  const firstResponse = await axios.post("/payments/send", paymentRequest)
  const replayResponse = await axios.post("/payments/send", paymentRequest)

  expect(replayResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )

  const { data: listData } = await axios.get(
    "/payments/list?recipient=richboyneedcash&status=pending",
  )
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0]).toMatchObject({
    recipient: "richboyneedcash",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    status: "pending",
  })
})

test("payment lifecycle can be completed or canceled", async () => {
  const { axios } = await getTestServer()

  const { data: sentData } = await axios.post("/payments/send", {
    recipient: "first-contributor",
    amount: 15,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })

  const paymentId = sentData.payment.payment_id

  const { data: getData } = await axios.get(
    `/payments/get?payment_id=${paymentId}`,
  )
  expect(getData.payment.status).toBe("pending")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: paymentId,
  })
  expect(completeData.payment.status).toBe("completed")
  expect(completeData.payment.completed_at).toBeString()

  const { data: cancelSentData } = await axios.post("/payments/send", {
    recipient: "second-contributor",
    amount: 20,
    currency: "USD",
  })
  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: cancelSentData.payment.payment_id,
  })
  expect(cancelData.payment.status).toBe("canceled")
  expect(cancelData.payment.canceled_at).toBeString()
})
