import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send a payment", async () => {
  const { axios } = await getTestServer()

  const { data } = await axios.post("/payments/send", {
    recipient: "octocat",
    amount_usd: 10,
    bounty_id: "bounty_123",
    issue_url: "https://github.com/tscircuit/fake-algora/issues/1",
    memo: "Issue #1 bounty",
  })

  expect(data.replayed).toBe(false)
  expect(data.payment.payment_id).toBe("pay_0")
  expect(data.payment.recipient).toBe("octocat")
  expect(data.payment.amount_usd).toBe(10)
  expect(data.payment.currency).toBe("USD")
  expect(data.payment.status).toBe("sent")
  expect(data.payment.transfer_reference).toBe("fake_algora_0")
  expect(data.payment.created_at).toBeDefined()
})

test("do not duplicate payments for the same idempotency key", async () => {
  const { axios } = await getTestServer()

  const body = {
    recipient: "octocat",
    amount_usd: 10,
    idempotency_key: "issue-1-octocat",
  }

  const firstResponse = await axios.post("/payments/send", body)
  const secondResponse = await axios.post("/payments/send", body)
  const listResponse = await axios.get("/payments/list")

  expect(firstResponse.data.replayed).toBe(false)
  expect(secondResponse.data.replayed).toBe(true)
  expect(secondResponse.data.payment.payment_id).toBe(
    firstResponse.data.payment.payment_id,
  )
  expect(listResponse.data.payments).toHaveLength(1)
})

test("list sent payments by recipient and bounty", async () => {
  const { axios } = await getTestServer()

  await axios.post("/payments/send", {
    recipient: "alice",
    amount_usd: 5,
    bounty_id: "bounty_a",
  })

  await axios.post("/payments/send", {
    recipient: "bob",
    amount_usd: 15,
    bounty_id: "bounty_b",
  })

  const recipientResponse = await axios.get("/payments/list?recipient=alice")
  const bountyResponse = await axios.get("/payments/list?bounty_id=bounty_b")

  expect(recipientResponse.data.payments).toHaveLength(1)
  expect(recipientResponse.data.payments[0].recipient).toBe("alice")
  expect(bountyResponse.data.payments).toHaveLength(1)
  expect(bountyResponse.data.payments[0].bounty_id).toBe("bounty_b")
})
