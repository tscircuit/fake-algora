import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { store } from "../store";

beforeEach(() => {
  store.reset();
});

// ── /bounties ──────────────────────────────────────────────────────────────

describe("GET /bounties", () => {
  it("returns the seeded bounties", async () => {
    const res = await request(app).get("/bounties");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it("includes expected fields on each bounty", async () => {
    const res = await request(app).get("/bounties");
    const bounty = res.body.data[0];
    expect(bounty).toHaveProperty("id");
    expect(bounty).toHaveProperty("title");
    expect(bounty).toHaveProperty("amount_usd");
    expect(bounty).toHaveProperty("currency");
    expect(bounty).toHaveProperty("status");
  });
});

describe("GET /bounties/:id", () => {
  it("returns a single bounty by id", async () => {
    const listRes = await request(app).get("/bounties");
    const { id } = listRes.body.data[0];

    const res = await request(app).get(`/bounties/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await request(app).get("/bounties/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("POST /bounties", () => {
  it("creates a new bounty and returns 201", async () => {
    const payload = {
      title: "New bounty",
      description: "A fresh bounty created in tests",
      amount_usd: 200,
      currency: "USD",
    };
    const res = await request(app).post("/bounties").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      title: payload.title,
      description: payload.description,
      amount_usd: payload.amount_usd,
      currency: payload.currency,
      status: "open",
    });
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("created_at");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/bounties").send({ title: "Only title" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(res.body).toHaveProperty("details");
  });

  it("returns 400 when amount_usd is not a positive number", async () => {
    const res = await request(app).post("/bounties").send({
      title: "Bad amount",
      description: "desc",
      amount_usd: -10,
      currency: "USD",
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("persists the new bounty so it appears in GET /bounties", async () => {
    await request(app).post("/bounties").send({
      title: "Persisted bounty",
      description: "Should show up in list",
      amount_usd: 50,
      currency: "USD",
    });

    const listRes = await request(app).get("/bounties");
    const titles = listRes.body.data.map((b: { title: string }) => b.title);
    expect(titles).toContain("Persisted bounty");
  });
});
