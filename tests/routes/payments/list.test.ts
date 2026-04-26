import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("list all payments", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/create", { recipient: "user1", amount: 100 })
  await axios.post("/payments/create", { recipient: "user2", amount: 200 })

  const { data } = await axios.get("/payments/list")

  expect(data.payments).toHaveLength(2)
})

test("list payments filtered by recipient", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/create", { recipient: "alice", amount: 100 })
  await axios.post("/payments/create", { recipient: "bob", amount: 200 })
  await axios.post("/payments/create", { recipient: "alice", amount: 300 })

  const { data } = await axios.get("/payments/list?recipient=alice")

  expect(data.payments).toHaveLength(2)
  expect(data.payments.every((p: any) => p.recipient === "alice")).toBe(true)
})

test("list payments filtered by status", async () => {
  const { axios } = await getTestServer()

  const create1 = await axios.post("/payments/create", {
    recipient: "user1",
    amount: 100,
  })
  await axios.post("/payments/create", { recipient: "user2", amount: 200 })

  await axios.post("/payments/complete", {
    payment_id: create1.data.payment.payment_id,
  })

  const { data: pending } = await axios.get("/payments/list?status=pending")
  const { data: completed } = await axios.get("/payments/list?status=completed")

  expect(pending.payments).toHaveLength(1)
  expect(completed.payments).toHaveLength(1)
})