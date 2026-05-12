import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

const expectPostError = async (
  request: Promise<unknown>,
  expectedStatus: number,
  expectedError: string,
) => {
  try {
    await request
    throw new Error("Expected request to fail")
  } catch (error) {
    const response = error as { status?: number; data?: { error?: string } }
    expect(response.status).toBe(expectedStatus)
    expect(response.data?.error).toBe(expectedError)
  }
}

test("creates, lists, fetches, and completes a payment", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "fake-algora-1",
  })

  expect(sendResponse.data.payment).toMatchObject({
    payment_id: "0",
    recipient: "maintainer@example.com",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "fake-algora-1",
    status: "pending",
  })

  const listResponse = await axios.get("/payments/list", {
    params: {
      status: "pending",
      repository: "tscircuit/fake-algora",
    },
  })

  expect(listResponse.data.payments).toHaveLength(1)

  const getResponse = await axios.post("/payments/get", {
    payment_id: "0",
  })

  expect(getResponse.data.payment.payment_id).toBe("0")

  const completeResponse = await axios.post("/payments/complete", {
    payment_id: "0",
  })

  expect(completeResponse.data.payment.status).toBe("completed")

  const completedListResponse = await axios.get("/payments/list", {
    params: { status: "completed" },
  })

  expect(completedListResponse.data.payments).toHaveLength(1)
})

test("replays payment send with the same idempotency key", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 35,
    currency: "USD",
    idempotency_key: "retry-key",
  })
  const secondResponse = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 35,
    currency: "USD",
    idempotency_key: "retry-key",
  })

  expect(secondResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )

  const listResponse = await axios.get("/payments/list")
  expect(listResponse.data.payments).toHaveLength(1)
})

test("rejects terminal payment transitions", async () => {
  const { axios } = await getTestServer()

  const sendResponse = await axios.post("/payments/send", {
    recipient: "contributor@example.com",
    amount: 12,
    currency: "USD",
  })
  const paymentId = sendResponse.data.payment.payment_id

  await axios.post("/payments/cancel", { payment_id: paymentId })

  await expectPostError(
    axios.post("/payments/complete", {
      payment_id: paymentId,
    }),
    409,
    "Payment is already terminal",
  )
})

test("returns 404 for missing payment lookup", async () => {
  const { axios } = await getTestServer()

  await expectPostError(
    axios.post("/payments/get", {
      payment_id: "missing",
    }),
    404,
    "Payment not found",
  )
})
