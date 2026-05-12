import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send, list, get, complete, and cancel fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: created } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
    bounty_id: "issue-1",
    idempotency_key: "reward-issue-1-octocat",
  })

  expect(created.ok).toBe(true)
  expect(created.payment.payment_id).toBe("0")
  expect(created.payment.status).toBe("pending")

  const { data: repeated } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    currency: "USD",
    idempotency_key: "reward-issue-1-octocat",
  })

  expect(repeated.payment.payment_id).toBe(created.payment.payment_id)

  const { data: pendingList } = await axios.get(
    "/payments/list?status=pending&repository=tscircuit/fake-algora",
  )

  expect(pendingList.payments).toHaveLength(1)
  expect(pendingList.payments[0].recipient).toBe("octocat")

  const { data: fetched } = await axios.get(
    `/payments/get?payment_id=${created.payment.payment_id}`,
  )

  expect(fetched.payment.repository).toBe("tscircuit/fake-algora")

  const { data: completed } = await axios.post("/payments/complete", {
    payment_id: created.payment.payment_id,
  })

  expect(completed.ok).toBe(true)
  expect(completed.payment.status).toBe("completed")
  expect(completed.payment.completed_at).toBeString()

  const { data: rejectedCancel } = await axios.post("/payments/cancel", {
    payment_id: created.payment.payment_id,
  })

  expect(rejectedCancel).toEqual({
    ok: false,
    error: "payment_not_pending",
  })
})

test("cancel keeps completed payments out of pending lists", async () => {
  const { axios } = await getTestServer()

  const { data: created } = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 25,
  })

  const { data: cancelled } = await axios.post("/payments/cancel", {
    payment_id: created.payment.payment_id,
  })

  expect(cancelled.payment.status).toBe("cancelled")
  expect(cancelled.payment.cancelled_at).toBeString()

  const { data: pendingList } = await axios.get("/payments/list?status=pending")
  expect(pendingList.payments).toHaveLength(0)
})
