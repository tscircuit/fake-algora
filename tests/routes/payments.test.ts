import { expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

test("send and list fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "alice",
    amount: 10,
    currency: "USD",
    bounty_id: "1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  expect(sendData.payment).toMatchObject({
    payment_id: "0",
    recipient: "alice",
    amount: 10,
    currency: "USD",
    status: "pending",
    bounty_id: "1",
    issue_number: 1,
    repository: "tscircuit/fake-algora",
  })

  const { data: listData } = await axios.get("/payments/list", {
    params: {
      recipient: "alice",
      status: "pending",
    },
  })

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe("0")
})

test("reuses payments for matching idempotency keys", async () => {
  const { axios } = await getTestServer()

  const { data: firstSendData } = await axios.post("/payments/send", {
    recipient: "bob",
    amount: 15,
    idempotency_key: "retry-token",
  })

  const { data: secondSendData } = await axios.post("/payments/send", {
    recipient: "bob",
    amount: 15,
    idempotency_key: "retry-token",
  })

  expect(secondSendData.payment.payment_id).toBe(
    firstSendData.payment.payment_id,
  )

  const { data: listData } = await axios.get("/payments/list")
  expect(listData.payments).toHaveLength(1)
})

test("gets and completes pending fake payments", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "carol",
    amount: 25,
  })

  const { data: getData } = await axios.get("/payments/get", {
    params: {
      payment_id: sendData.payment.payment_id,
    },
  })

  expect(getData.payment.status).toBe("pending")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("completed")
})

test("does not mutate terminal fake payment states", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "dana",
    amount: 30,
  })

  const { data: cancelData } = await axios.post("/payments/cancel", {
    payment_id: sendData.payment.payment_id,
  })

  expect(cancelData.payment.status).toBe("canceled")

  const { data: completeData } = await axios.post("/payments/complete", {
    payment_id: sendData.payment.payment_id,
  })

  expect(completeData.payment.status).toBe("canceled")
})

test("marks pending fake payments as failed", async () => {
  const { axios } = await getTestServer()

  const { data: sendData } = await axios.post("/payments/send", {
    recipient: "erin",
    amount: 45,
    repository: "tscircuit/fake-algora",
  })

  const { data: failData } = await axios.post("/payments/fail", {
    payment_id: sendData.payment.payment_id,
  })

  expect(failData.payment.status).toBe("failed")

  const { data: listData } = await axios.get("/payments/list", {
    params: {
      repository: "tscircuit/fake-algora",
      status: "failed",
    },
  })

  expect(listData.payments).toHaveLength(1)
  expect(listData.payments[0].payment_id).toBe(sendData.payment.payment_id)
})
