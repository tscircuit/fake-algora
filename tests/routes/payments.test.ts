import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and list fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "0x7bE8796529f13882430ECeAB807712039E0dAfA2",
    amount_usd: 10,
    memo: "Issue reward",
    bounty_id: "bounty_1",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })

  expect(sendData.created).toBe(true)
  expect(sendData.payment).toMatchObject({
    payment_id: "payment_0",
    recipient: "0x7bE8796529f13882430ECeAB807712039E0dAfA2",
    amount_usd: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "bounty_1",
    repository: "tscircuit/fake-algora",
    issue_number: 1,
  })

  const { data: listData } = await axios.get(
    "/payments/list?repository=tscircuit/fake-algora&status=pending",
  )
  const { data: getData } = await axios.get(
    `/payments/get?payment_id=${sendData.payment.payment_id}`,
  )

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe("payment_0")
  expect(getData.payment.payment_id).toBe("payment_0")
})

test("send payment is idempotent when an idempotency key is reused", async () => {
  const { axios } = await getTestServer()

  const requestBody = {
    recipient: "6Da5nELroja5ngTwYZuofFur5V7gZCLvKVRX7iUahwz2",
    amount_usd: 5,
    idempotency_key: "reward-1",
  }

  const { data: firstSend } = await axios.post("/payments/send", requestBody)
  const { data: secondSend } = await axios.post("/payments/send", requestBody)
  const { data: listData } = await axios.get("/payments/list")

  expect(firstSend.created).toBe(true)
  expect(secondSend.created).toBe(false)
  expect(secondSend.payment.payment_id).toBe(firstSend.payment.payment_id)
  expect(listData.payments).toHaveLength(1)
})

test("complete and cancel payment records", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "recipient@example.com",
    amount_usd: 25,
  })

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("completed")

  const { data: secondSendData } = await axios.post("/payments/send", {
    recipient: "cancel@example.com",
    amount_usd: 15,
  })

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: secondSendData.payment.payment_id,
  })

  expect(cancelData.payment.status).toBe("cancelled")
})
