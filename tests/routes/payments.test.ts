import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "surim0n",
    amount: 10,
    currency: "USD",
    bounty_issue: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "issue-1-payment",
  })

  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "0",
    recipient: "surim0n",
    amount: 10,
    currency: "USD",
    bounty_issue: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "issue-1-payment",
    status: "pending",
  })

  const duplicateResponse = await axios.post("/payments/send", {
    recipient: "surim0n",
    amount: 10,
    currency: "USD",
    idempotency_key: "issue-1-payment",
  })

  expect(duplicateResponse.data.payment.payment_id).toBe("0")

  const listResponse = await axios.get(
    "/payments/list?recipient=surim0n&status=pending",
  )

  expect(listResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.get("/payments/get?payment_id=0")

  expect(getResponse.data.payment.recipient).toBe("surim0n")

  const completeResponse = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })

  expect(completeResponse.data.payment.status).toBe("completed")
})

test("completed payments cannot be moved into another terminal status", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 25,
  })

  await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "completed",
  })

  const cancelResponse = await axios.post("/payments/update-status", {
    payment_id: "0",
    status: "canceled",
  })

  expect(cancelResponse.data.payment).toBeUndefined()

  const listResponse = await axios.get("/payments/list?status=completed")

  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].status).toBe("completed")
})
