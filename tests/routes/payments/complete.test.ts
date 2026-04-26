import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("complete a payment", async () => {
  const { axios } = await getTestServer()

  const { data: createData } = await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })

  const payment_id = createData.payment.payment_id

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id,
  })

  expect(completeData.ok).toBe(true)

  const { data: listData } = await axios.get("/payments/list?status=completed")
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe(payment_id)
  expect(listData.payments[0].completed_at).toBeDefined()
})

test("completing a non-existent payment returns ok: false", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/complete", {
    payment_id: "nonexistent_id",
  })

  expect(data.ok).toBe(false)
})