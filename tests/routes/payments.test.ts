import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and list fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient_github_username: "Vinzz2303",
    amount: 10,
    currency: "USD",
    bounty_issue_url: "https://github.com/tscircuit/fake-algora/issues/1",
  })

  expect(sendData.payment.payment_id).toBe("0")
  expect(sendData.payment.status).toBe("pending")

  const { data: listData } = await axios.get(
    "/payments/list?recipient_github_username=Vinzz2303",
  )

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].amount).toBe(10)
})

test("idempotency key replays the first payment", async () => {
  const { axios } = await getTestServer()

  const body = {
    recipient_github_username: "Vinzz2303",
    amount: 10,
    currency: "USD",
    idempotency_key: "claim-1",
  }

  const { data: firstData } = await axios.post("/payments/send", body)
  const { data: replayData } = await axios.post("/payments/send", body)
  const { data: listData } = await axios.get("/payments/list")

  expect(replayData.payment.payment_id).toBe(firstData.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("complete only mutates pending payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient_github_username: "Vinzz2303",
    amount: 10,
  })

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.ok).toBe(true)
  expect(completeData.payment.status).toBe("completed")

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: sendData.payment.payment_id,
  })

  expect(cancelData.ok).toBe(true)
  expect(cancelData.payment.status).toBe("completed")
})
