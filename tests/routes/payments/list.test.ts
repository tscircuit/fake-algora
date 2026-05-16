import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("list payments returns empty array initially", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.get("/payments/list")

  expect(data.payments).toEqual([])
})

test("list payments after sending one", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    amount: 100,
    recipient: "frank@example.com",
    description: "Large payment",
  })

  const { data } = await axios.get("/payments/list")

  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].amount).toBe(100)
  expect(data.payments[0].recipient).toBe("frank@example.com")
  expect(data.payments[0].description).toBe("Large payment")
  expect(data.payments[0].status).toBe("completed")
})
