import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { store } from "../store";

beforeEach(() => {
  store.reset();
});

describe("GET /bounties", () => {
  it("returns a list of all bounties", async () => {
    const res = await request(app).get("/bounties");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("GET /bounties/:id", () => {
  it("returns a single bounty by id", async () => {
    const res = await request(app).get("/bounties/bounty-1");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("bounty-1");
  });

  it("returns 404 for a non-existent bounty", async () => {
    const res = await request(app).get("/bounties/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Bounty not found");
  });
});

describe("POST /bounties", () => {
  it("creates a new bounty with valid input", async () => {
    const payload = {
      title: "New Test Bounty",
      description: "A bounty created in tests.",
      amount_usd: 500,
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
    expect(res.body.data.id).toBeDefined();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/bounties").send({ title: "Only title" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
    expect(typeof res.body.details).toBe("string");
  });

  it("returns 400 when amount_usd is not positive", async () => {
    const res = await request(app).post("/bounties").send({
      title: "Bad bounty",
      description: "Negative amount",
      amount_usd: -50,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request body");
  });
});
