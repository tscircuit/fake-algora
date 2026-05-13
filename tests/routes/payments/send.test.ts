import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment and list it", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount_cents: 1000,
    currency: "usd",
    description: "Issue #1 bounty payout",
    bounty_id: "bounty_1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(data).toMatchObject({
    ok: true,
    duplicate: false,
    payment: {
      payment_id: "pay_0",
      recipient: "octocat",
      amount_cents: 1000,
      currency: "USD",
      status: "sent",
      description: "Issue #1 bounty payout",
      bounty_id: "bounty_1",
      issue_number: 1,
      repository: "tscircuit/fake-algora",
    },
  })
  expect(data.payment.created_at).toBeString()
  expect(data.payment.updated_at).toBeString()

  const getResponse = await axios.get(
    `/payments/get?payment_id=${data.payment.payment_id}`,
  )
  expect(getResponse.data.payment).toEqual(data.payment)

  const updateResponse = await axios.post("/payments/update-status", {
    payment_id: data.payment.payment_id,
    status: "completed",
  })
  expect(updateResponse.data).toMatchObject({
    ok: true,
    payment: {
      payment_id: data.payment.payment_id,
      status: "completed",
    },
  })
  expect(updateResponse.data.payment.updated_at).toBeString()
})

test("send payment supports amount dollars and idempotency keys", async () => {
  const { axios } = await getTestServer()

  const firstResponse = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 12.34,
    idempotency_key: "issue-1-maintainer-12-34",
  })
  const secondResponse = await axios.post("/payments/send", {
    recipient: "maintainer",
    amount: 12.34,
    idempotency_key: "issue-1-maintainer-12-34",
  })

  expect(firstResponse.data).toMatchObject({
    ok: true,
    duplicate: false,
    payment: {
      recipient: "maintainer",
      amount_cents: 1234,
      currency: "USD",
      status: "sent",
      idempotency_key: "issue-1-maintainer-12-34",
    },
  })
  expect(secondResponse.data).toEqual({
    ok: true,
    duplicate: true,
    payment: firstResponse.data.payment,
  })

  const listResponse = await axios.get("/payments/list?recipient=maintainer")

  expect(listResponse.data.payments).toHaveLength(1)
})
