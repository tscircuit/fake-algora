import { describe, expect, test } from "bun:test"
import { getTestServer } from "tests/fixtures/get-test-server"

describe("payments API", () => {
  test("sends, lists, and gets a fake payment", async () => {
    const { axios } = await getTestServer()

    const { data: sendData, status } = await axios.post("/payments/send", {
      recipient: "alice@example.com",
      amount: 25,
      currency: "USD",
      bounty_issue: "tscircuit/fake-algora#1",
      repository: "tscircuit/fake-algora",
      idempotency_key: "payment-create-1",
    })

    expect(status).toBe(201)
    expect(sendData.idempotent_replay).toBe(false)
    expect(sendData.payment).toMatchObject({
      payment_id: "0",
      recipient: "alice@example.com",
      amount: 25,
      currency: "USD",
      bounty_issue: "tscircuit/fake-algora#1",
      repository: "tscircuit/fake-algora",
      status: "pending",
      idempotency_key: "payment-create-1",
    })

    const { data: listData } = await axios.get("/payments/list", {
      params: {
        recipient: "alice@example.com",
        status: "pending",
      },
    })
    expect(listData.payments).toHaveLength(1)
    expect(listData.payments[0].payment_id).toBe("0")

    const { data: getData } = await axios.get("/payments/get", {
      params: {
        payment_id: "0",
      },
    })
    expect(getData).toMatchObject({
      ok: true,
      payment: {
        payment_id: "0",
        recipient: "alice@example.com",
      },
    })
  })

  test("replays idempotent sends without creating duplicates", async () => {
    const { axios } = await getTestServer()

    const { data: firstSend } = await axios.post("/payments/send", {
      recipient: "bob@example.com",
      amount: 10,
      idempotency_key: "bob-payment",
    })
    const { data: secondSend, status } = await axios.post("/payments/send", {
      recipient: "bob@example.com",
      amount: 10,
      idempotency_key: "bob-payment",
    })

    expect(status).toBe(200)
    expect(secondSend.idempotent_replay).toBe(true)
    expect(secondSend.payment).toEqual(firstSend.payment)

    const { data: listData } = await axios.get("/payments/list")
    expect(listData.payments).toHaveLength(1)
  })

  test("completes and preserves terminal payment status", async () => {
    const { axios } = await getTestServer()

    await axios.post("/payments/send", {
      recipient: "carol@example.com",
      amount: 33,
    })

    const { data: completedData } = await axios.post("/payments/complete", {
      payment_id: "0",
    })
    expect(completedData).toMatchObject({
      ok: true,
      payment: {
        payment_id: "0",
        status: "completed",
      },
    })

    const { data: canceledData } = await axios.post("/payments/cancel", {
      payment_id: "0",
    })
    expect(canceledData).toMatchObject({
      ok: true,
      payment: {
        payment_id: "0",
        status: "completed",
      },
    })
  })

  test("returns a 404 response for unknown payments", async () => {
    const { axios } = await getTestServer()

    const response = await axios.get("/payments/get", {
      params: {
        payment_id: "missing",
      },
      validateStatus: () => true,
    })

    expect(response.status).toBe(404)
    expect(response.data).toEqual({
      ok: false,
      error: "Payment not found",
    })
  })
})
