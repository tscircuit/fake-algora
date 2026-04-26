import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("get a payment by id", async () => {
  const { axios } = await getTestServer()

  const { data: createData } = await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })

  const payment_id = createData.payment.payment_id

  const { data } = await axios.get(`/payments/get?payment_id=${payment_id}`)

  expect(data.payment).toBeDefined()
  expect(data.payment.payment_id).toBe(payment_id)
  expect(data.payment.recipient).toBe("user1")
})

test("get a non-existent payment returns null", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.get("/payments/get?payment_id=nonexistent")

  expect(data.payment).toBeNull()
})