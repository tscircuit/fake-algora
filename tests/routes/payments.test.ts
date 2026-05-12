import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("creates and reads a fake payment", async () => {
  const { axios } = await getTestServer()

  const createRes = await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_cents: 2500,
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "claim-1",
  })

  expect(createRes.status).toBe(200)
  expect(createRes.data.ok).toBe(true)
  expect(createRes.data.idempotent_replay).toBe(false)
  expect(createRes.data.payment).toMatchObject({
    payment_id: "payment_0",
    recipient_email: "solver@example.com",
    amount_cents: 2500,
    currency: "usd",
    status: "pending",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
    idempotency_key: "claim-1",
  })

  const getRes = await axios.get("/payments/get?payment_id=payment_0")

  expect(getRes.status).toBe(200)
  expect(getRes.data.payment.payment_id).toBe("payment_0")
})

test("replays matching idempotency keys without creating duplicates", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_cents: 1000,
    idempotency_key: "repeatable-send",
  })
  const replayRes = await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_cents: 9999,
    idempotency_key: "repeatable-send",
  })
  const listRes = await axios.get("/payments/list")

  expect(replayRes.data.idempotent_replay).toBe(true)
  expect(replayRes.data.payment.amount_cents).toBe(1000)
  expect(listRes.data.payments).toHaveLength(1)
})

test("filters payments by status, recipient, and repository", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient_email: "one@example.com",
    amount_cents: 1000,
    repository: "tscircuit/fake-algora",
  })
  await axios.post("/payments/send", {
    recipient_email: "two@example.com",
    amount_cents: 2000,
    repository: "other/repo",
  })
  await axios.post("/payments/complete", { payment_id: "payment_1" })

  const pendingRes = await axios.get("/payments/list?status=pending")
  const completedRes = await axios.get(
    "/payments/list?status=completed&repository=other/repo",
  )
  const recipientRes = await axios.get(
    "/payments/list?recipient_email=one@example.com",
  )

  expect(
    pendingRes.data.payments.map((payment: any) => payment.payment_id),
  ).toEqual(["payment_0"])
  expect(
    completedRes.data.payments.map((payment: any) => payment.payment_id),
  ).toEqual(["payment_1"])
  expect(
    recipientRes.data.payments.map((payment: any) => payment.payment_id),
  ).toEqual(["payment_0"])
})

test("prevents terminal payment status changes", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient_email: "solver@example.com",
    amount_cents: 1000,
  })
  const completeRes = await axios.post("/payments/complete", {
    payment_id: "payment_0",
  })

  expect(completeRes.data.payment.status).toBe("completed")

  try {
    await axios.post("/payments/cancel", { payment_id: "payment_0" })
    throw new Error("Expected canceling a completed payment to fail")
  } catch (error: any) {
    expect(error.status).toBe(409)
    expect(error.data).toEqual({
      ok: false,
      error: "payment_is_not_pending",
    })
  }
})

test("returns a 404 for missing payments", async () => {
  const { axios } = await getTestServer()

  try {
    await axios.get("/payments/get?payment_id=missing")
    throw new Error("Expected missing payment lookup to fail")
  } catch (error: any) {
    expect(error.status).toBe(404)
    expect(error.data).toEqual({
      ok: false,
      error: "payment_not_found",
    })
  }
})
