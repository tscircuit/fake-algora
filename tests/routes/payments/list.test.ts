import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("list payments", async () => {
  const { axios } = await getTestServer()

  // Create some payments
  await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })

  await axios.post("/payments/create", {
    recipient: "user2",
    amount: 200,
  })

  const { data } = await axios.get("/payments/list")

  expect(data.payments).toBeDefined()
  expect(data.payments.length).toBe(2)
})

test("list payments filtered by recipient", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })

  await axios.post("/payments/create", {
    recipient: "user2",
    amount: 200,
  })

  const { data } = await axios.get("/payments/list?recipient=user1")

  expect(data.payments).toBeDefined()
  expect(data.payments.length).toBe(1)
  expect(data.payments[0].recipient).toBe("user1")
})
