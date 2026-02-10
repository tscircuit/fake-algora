import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("complete a payment", async () => {
  const { axios } = await getTestServer()

  // Create a payment
  const createResponse = await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })

  const payment_id = createResponse.data.payment.payment_id

  // Complete the payment
  const completeResponse = await axios.post("/payments/complete", {
    payment_id,
  })

  expect(completeResponse.data.ok).toBe(true)

  // Verify payment status
  const getResponse = await axios.get(`/payments/get?payment_id=${payment_id}`)
  expect(getResponse.data.payment.status).toBe("completed")
  expect(getResponse.data.payment.completed_at).toBeDefined()
})
