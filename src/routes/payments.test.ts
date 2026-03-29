import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { store } from "../store";

beforeEach(() => {
  store.reset();
});

describe("GET /payments", () => {
  it("returns an empty list when no payments exist", async () => {
    const res = await request(app).get("/payments");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data).toHaveLength(0);
  });
});

describe("GET /payments/:id", () => {
  it("returns 404 for a non-existent payment", async () => {
    const res = await request(app).get("/payments/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Payment not found");
  });

  it("returns a payment by id after it has been created", async () => {
    // bounty-2 has a recipient assigned
    const sendRes = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-2" });
    expect(sendRes.status).toBe(201);

    const paymentId = sendRes.body.data.id;
    const getRes = await request(app).get(`/payments/${paymentId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(paymentId);
  });
});

describe("POST /payments/send", () => {
  it("creates a payment and marks the bounty as paid", async () => {
    // bounty-2 is in_progress and has recipient 'alice'
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-2" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bounty_id: "bounty-2",
      amount_usd: 250,
      currency: "USD",
      recipient_username: "alice",
      status: "completed",
    });

    // Confirm bounty is now marked as paid
    const bountyRes = await request(app).get("/bounties/bounty-2");
    expect(bountyRes.body.data.status).toBe("paid");
  });

  it("returns 400 when bounty_id is missing", async () => {
    const res = await request(app).post("/payments/send").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
    expect(typeof res.body.details).toBe("string");
  });

  it("returns 404 when bounty does not exist", async () => {
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "nonexistent-bounty" });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Bounty not found");
  });

  it("returns 400 when bounty has no recipient assigned", async () => {
    // bounty-1 has recipient_username: null
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no recipient/i);
  });

  it("returns 409 when bounty has already been paid (double-payment guard)", async () => {
    // First payment succeeds
    await request(app).post("/payments/send").send({ bounty_id: "bounty-2" });

    // Second payment should be rejected
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-2" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already been paid/i);
  });

  it("returns 400 when trying to pay a cancelled bounty", async () => {
    // Manually cancel the bounty via the store
    store.updateBountyStatus("bounty-2", "cancelled");

    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-2" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cancelled/i);
  });

  it("payment fields are derived from the bounty, not from the request body", async () => {
    // Even if extra fields are sent in the body they should be ignored
    const res = await request(app).post("/payments/send").send({
      bounty_id: "bounty-2",
      amount_usd: 9999,           // should be ignored
      currency: "EUR",            // should be ignored
      recipient_username: "hacker", // should be ignored
    });

    expect(res.status).toBe(201);
    // Values must match the bounty, not the injected body values
    expect(res.body.data.amount_usd).toBe(250);
    expect(res.body.data.currency).toBe("USD");
    expect(res.body.data.recipient_username).toBe("alice");
  });
});
