import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("sends, retrieves, lists, and completes a payment", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.reused).toBe(false)
  expect(sendData.payment).toMatchObject({
    payment_id: "0",
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    status: "pending",
  })

  const { data: getData } = await axios.get(
    `/payments/get?payment_id=${sendData.payment.payment_id}`,
  )
  expect(getData.payment.payment_id).toBe(sendData.payment.payment_id)

  const { data: listData } = await axios.get(
    "/payments/list?status=pending&repository=tscircuit/fake-algora",
  )
  expect(listData.payments).toHaveLength(1)

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })
  expect(completeData.payment.status).toBe("completed")
  expect(typeof completeData.payment.completed_at).toBe("string")
})

test("reuses a payment when the idempotency key matches", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "octocat",
    amount: 25,
    currency: "USD",
    idempotency_key: "github-delivery-1",
  }

  const { data: firstSend } = await axios.post("/payments/send", payload)
  const { data: retrySend } = await axios.post("/payments/send", payload)
  const { data: listData } = await axios.get("/payments/list")

  expect(firstSend.reused).toBe(false)
  expect(retrySend.reused).toBe(true)
  expect(retrySend.payment.payment_id).toBe(firstSend.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("filters payments and cancels pending payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice",
    amount: 5,
    repository: "owner/repo-a",
  })
  const { data: secondSend } = await axios.post("/payments/send", {
    recipient: "bob",
    amount: 15,
    repository: "owner/repo-b",
  })

  const { data: filteredData } = await axios.get(
    "/payments/list?recipient=alice",
  )
  expect(filteredData.payments).toHaveLength(1)
  expect(filteredData.payments[0].recipient).toBe("alice")

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: secondSend.payment.payment_id,
  })

  expect(cancelData.payment.status).toBe("cancelled")
  expect(typeof cancelData.payment.cancelled_at).toBe("string")
})
