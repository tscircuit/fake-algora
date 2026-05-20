import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, complete, and get fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "alice",
    amount: 10,
    currency: "USD",
    bounty_id: "fake-algora-1",
    issue_number: "1",
    repository: "tscircuit/fake-algora",
    idempotency_key: "send-alice-10",
  })

  expect(sendData.payment.payment_id).toBe("0")
  expect(sendData.payment.status).toBe("pending")

  const { data: replayData } = await axios.post("/payments/send", {
    recipient: "alice",
    amount: 10,
    currency: "USD",
    idempotency_key: "send-alice-10",
  })

  expect(replayData.payment.payment_id).toBe(sendData.payment.payment_id)

  const { data: listData } = await axios.get(
    "/payments/list?recipient=alice&status=pending",
  )

  expect(listData.payments).toHaveLength(1)

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("completed")

  const { data: getData } = await axios.get(
    `/payments/get?payment_id=${sendData.payment.payment_id}`,
  )

  expect(getData.payment.status).toBe("completed")
})

test("cancel rejects already completed fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "bob",
    amount: 5,
  })

  await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  await expect(
    axios.post("/payments/cancel", {
      payment_id: sendData.payment.payment_id,
    }),
  ).rejects.toMatchObject({
    status: 409,
  })
})
