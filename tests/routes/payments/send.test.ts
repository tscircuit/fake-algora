import { getTestServer } from "tests/fixtures/get-test-server"
import { test, expect } from "bun:test"

test("send a payment and verify it appears in list", async () => {
  const { ky } = await getTestServer()

  const sendData = await ky
    .post("payments/send", {
      json: {
        recipient_email: "alice@example.com",
        amount_usd: 25,
        note: "Bounty reward",
      },
    })
    .json<any>()

  expect(sendData.ok).toBe(true)
  expect(sendData.payment.recipient_email).toBe("alice@example.com")
  expect(sendData.payment.amount_usd).toBe(25)
  expect(sendData.payment.status).toBe("sent")
  expect(sendData.payment.sent_at).toBeDefined()

  const listData = await ky.get("payments/list").json<any>()
  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe(sendData.payment.payment_id)
})

test("filter payments by recipient_email", async () => {
  const { ky } = await getTestServer()

  await ky.post("payments/send", {
    json: { recipient_email: "alice@example.com", amount_usd: 25 },
  })
  await ky.post("payments/send", {
    json: { recipient_email: "bob@example.com", amount_usd: 50 },
  })

  const data = await ky
    .get("payments/list", {
      searchParams: { recipient_email: "alice@example.com" },
    })
    .json<any>()
  expect(data.payments).toHaveLength(1)
  expect(data.payments[0].recipient_email).toBe("alice@example.com")
})
