import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and fetch a fake payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount: 10,
    owner: "tscircuit",
    repo: "fake-algora",
    issue_number: 1,
    bounty_id: "fake-bounty-1",
    idempotency_key: "retry-safe-payment",
  })

  expect(data.idempotent).toBe(false)
  expect(data.payment.payment_id).toBe("0")
  expect(data.payment.status).toBe("pending")

  const { data: fetchedData } = await axios.get(
    `/payments/get?payment_id=${data.payment.payment_id}`,
  )

  expect(fetchedData.payment.recipient).toBe("octocat")
  expect(fetchedData.payment.amount).toBe(10)
})

test("send is idempotent when the same key is reused", async () => {
  const { axios } = await getTestServer()

  const payload = {
    recipient: "octocat",
    amount: 10,
    idempotency_key: "same-request",
  }

  const { data: firstData } = await axios.post("/payments/send", payload)
  const { data: secondData } = await axios.post("/payments/send", payload)

  expect(secondData.idempotent).toBe(true)
  expect(secondData.payment.payment_id).toBe(firstData.payment.payment_id)

  const { data: listData } = await axios.get("/payments/list")

  expect(listData.payments).toHaveLength(1)
})

test("list filters payments by recipient, status, and repository", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice",
    amount: 5,
    owner: "tscircuit",
    repo: "fake-algora",
    issue_number: 1,
  })
  await axios.post("/payments/send", {
    recipient: "bob",
    amount: 15,
    owner: "tscircuit",
    repo: "other-repo",
    issue_number: 2,
  })

  const { data } = await axios.get(
    "/payments/list?recipient=alice&status=pending&owner=tscircuit&repo=fake-algora&issue_number=1",
  )

  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].recipient).toBe("alice")
})

test("complete and cancel update payment status", async () => {
  const { axios } = await getTestServer()

  const { data: firstData } = await axios.post("/payments/send", {
    recipient: "alice",
    amount: 5,
  })
  const { data: completedData } = await axios.post("/payments/complete", {
    payment_id: firstData.payment.payment_id,
  })

  expect(completedData.payment.status).toBe("completed")
  expect(completedData.payment.completed_at).toBeTruthy()

  const { data: secondData } = await axios.post("/payments/send", {
    recipient: "bob",
    amount: 15,
  })
  const { data: canceledData } = await axios.post("/payments/cancel", {
    payment_id: secondData.payment.payment_id,
    cancel_reason: "duplicate bounty claim",
  })

  expect(canceledData.payment.status).toBe("canceled")
  expect(canceledData.payment.cancel_reason).toBe("duplicate bounty claim")
})
