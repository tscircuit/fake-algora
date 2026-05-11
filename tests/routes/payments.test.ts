import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, and complete a fake payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "payment_0",
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const listResponse = await axios.get(
    "/payments/list?recipient=octocat&status=pending",
  )
  expect(listResponse.data.payments).toHaveLength(1)
  expect(listResponse.data.payments[0].payment_id).toBe("payment_0")

  const getResponse = await axios.get("/payments/get?payment_id=payment_0")
  expect(getResponse.data.payment.payment_id).toBe("payment_0")

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "payment_0",
  })
  expect(completeResponse.data.payment.status).toBe("completed")

  const completedListResponse = await axios.get(
    "/payments/list?repository=tscircuit/fake-algora&status=completed",
  )
  expect(completedListResponse.data.payments).toHaveLength(1)
})

test("send payment is idempotent when an idempotency key is supplied", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 25,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-transfer",
  })
  const secondResponse = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 25,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    idempotency_key: "retry-safe-transfer",
  })

  expect(secondResponse.data.payment).toEqual(firstResponse.data.payment)

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("cancel a pending fake payment", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 5,
    currency: "USD",
  })

  const cancelResponse = await axios.post("/payments/cancel", {
    payment_id: "payment_0",
  })

  expect(cancelResponse.data.payment.status).toBe("cancelled")
})
