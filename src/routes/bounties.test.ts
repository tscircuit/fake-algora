import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { store } from "../store";

beforeEach(() => {
  store.reset();
});

describe("GET /bounties", () => {
  it("returns an empty list when no bounties exist", async () => {
    const res = await request(app).get("/bounties");
    expect(res.status).toBe(200);
    expect(res.body.bounties).toEqual([]);
  });

  it("returns seeded bounties when store is populated", async () => {
    store.createBounty({
      issue_number: 1,
      repo: "tscircuit/fake-algora",
      amount_usd: 10,
      currency: "USD",
      status: "open",
      recipient_username: null,
    });
    const res = await request(app).get("/bounties");
    expect(res.status).toBe(200);
    expect(res.body.bounties).toHaveLength(1);
  });
});

describe("POST /bounties", () => {
  it("creates a bounty with valid body", async () => {
    const res = await request(app).post("/bounties").send({
      issue_number: 5,
      repo: "tscircuit/core",
      amount_usd: 25,
    });
    expect(res.status).toBe(201);
    expect(res.body.bounty.amount_usd).toBe(25);
    expect(res.body.bounty.status).toBe("open");
  });

  it("returns 400 for invalid body", async () => {
    const res = await request(app).post("/bounties").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid/i);
  });
});

describe("GET /bounties/:id", () => {
  it("returns 404 for unknown id", async () => {
    const res = await request(app).get("/bounties/nonexistent");
    expect(res.status).toBe(404);
  });

  it("returns the bounty for a known id", async () => {
    const bounty = store.createBounty({
      issue_number: 10,
      repo: "tscircuit/fake-algora",
      amount_usd: 100,
      currency: "USD",
      status: "open",
      recipient_username: null,
    });
    const res = await request(app).get(`/bounties/${bounty.id}`);
    expect(res.status).toBe(200);
    expect(res.body.bounty.id).toBe(bounty.id);
  });
});
