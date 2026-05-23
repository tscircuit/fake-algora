import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("creates, lists, and looks up fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.idempotent).toBe(false)
  expect(sendData.payment).toMatchObject({
    payment_id: "0",
    recipient: "contributor@example.com",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty-1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    status: "pending",
  })

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe("0")

  const { data: getData } = await axios.get("/payments/get?payment_id=0")
  expect(getData.payment.recipient).toBe("contributor@example.com")
})

test("reuses an existing payment when idempotency key is replayed", async () => {
  const { axios } = await getTestServer()

  const requestBody = {
    recipient: "agent@example.com",
    amount: 25,
    idempotency_key: "issue-1-agent@example.com",
  }

  const { data: firstSend } = await axios.post("/payments/send", requestBody)
  const { data: replayedSend } = await axios.post("/payments/send", requestBody)
  const { data: listData } = await axios.get("/payments/list")

  expect(firstSend.idempotent).toBe(false)
  expect(replayedSend.idempotent).toBe(true)
  expect(replayedSend.payment.payment_id).toBe(firstSend.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("filters fake payments and guards terminal status transitions", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice@example.com",
    amount: 10,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient: "bob@example.com",
    amount: 20,
    repository: "tscircuit/file-server",
  })

  const { data: filteredByRecipient } = await axios.get(
    "/payments/list?recipient=alice@example.com",
  )
  expect(filteredByRecipient.payments).toHaveLength(1)
  expect(filteredByRecipient.payments[0].recipient).toBe("alice@example.com")

  const { data: completed } = await axios.post("/payments/complete", {
    payment_id: "0",
  })
  expect(completed.payment.status).toBe("completed")
  expect(completed.payment.completed_at).toBeTruthy()

  try {
    await axios.post("/payments/cancel", { payment_id: "0" })
    throw new Error("Expected terminal transition to fail")
  } catch (error: any) {
    expect(error.status).toBe(409)
    expect(error.data.error).toBe("payment_already_terminal")
  }

  const { data: completedPayments } = await axios.get(
    "/payments/list?status=completed",
  )
  expect(completedPayments.payments).toHaveLength(1)
})
