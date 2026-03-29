import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { store } from "../store";

beforeEach(() => {
  store.reset();
});

// ── helpers ────────────────────────────────────────────────────────────────

/** Create a bounty via the API and return it. */
async function createBounty(overrides: Partial<{
  title: string;
  description: string;
  amount_usd: number;
  currency: string;
  recipient_username: string;
}> = {}) {
  const payload = {
    title: "Test bounty",
    description: "A bounty for testing payments",
    amount_usd: 100,
    currency: "USD",
    ...overrides,
  };
  const res = await request(app).post("/bounties").send(payload);
  expect(res.status).toBe(201);
  return res.body.data;
}

// ── GET /payments ──────────────────────────────────────────────────────────

describe("GET /payments", () => {
  it("returns an empty list when no payments exist", async () => {
    const res = await request(app).get("/payments");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("lists payments after one has been sent", async () => {
    const bounty = await createBounty({ recipient_username: "alice" });
    await request(app).post("/payments/send").send({ bounty_id: bounty.id });

    const res = await request(app).get("/payments");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

// ── GET /payments/:id ──────────────────────────────────────────────────────

describe("GET /payments/:id", () => {
  it("returns a payment by id", async () => {
    const bounty = await createBounty({ recipient_username: "carol" });
    const sendRes = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });
    const paymentId: string = sendRes.body.data.id;

    const res = await request(app).get(`/payments/${paymentId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(paymentId);
  });

  it("returns 404 for an unknown payment id", async () => {
    const res = await request(app).get("/payments/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ── POST /payments/send ────────────────────────────────────────────────────

describe("POST /payments/send", () => {
  it("creates a payment and marks the bounty as paid", async () => {
    const bounty = await createBounty({ recipient_username: "dave" });

    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      bounty_id: bounty.id,
      amount_usd: bounty.amount_usd,
      currency: bounty.currency,
      recipient_username: "dave",
    });
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("created_at");

    // The bounty should now be marked as paid
    const bountyRes = await request(app).get(`/bounties/${bounty.id}`);
    expect(bountyRes.body.data.status).toBe("paid");
  });

  it("derives amount/currency from the bounty (not the request body)", async () => {
    const bounty = await createBounty({
      recipient_username: "eve",
      amount_usd: 250,
      currency: "USD",
    });

    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });

    expect(res.status).toBe(201);
    expect(res.body.data.amount_usd).toBe(250);
    expect(res.body.data.currency).toBe("USD");
    expect(res.body.data.recipient_username).toBe("eve");
  });

  it("returns 400 when bounty_id is missing", async () => {
    const res = await request(app).post("/payments/send").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 404 when the bounty does not exist", async () => {
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "nonexistent-id" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 422 when the bounty has no recipient assigned", async () => {
    // Create a bounty WITHOUT a recipient_username
    const bounty = await createBounty();

    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 409 when the bounty has already been paid (double-payment guard)", async () => {
    const bounty = await createBounty({ recipient_username: "frank" });

    // First payment — should succeed
    const first = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });
    expect(first.status).toBe(201);

    // Second payment — should be rejected
    const second = await request(app)
      .post("/payments/send")
      .send({ bounty_id: bounty.id });
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty("error");
  });

  it("also rejects payment for a seeded bounty that is already paid", async () => {
    // seed data includes bounty-seed-3 with status "paid"
    const res = await request(app)
      .post("/payments/send")
      .send({ bounty_id: "bounty-seed-3" });
    expect(res.status).toBe(409);
  });
});
