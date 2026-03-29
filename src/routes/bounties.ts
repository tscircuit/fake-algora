import { Router } from "express";
import { z } from "zod";
import { store } from "../store";

export const bountiesRouter = Router();

const CreateBountySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  amount_usd: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  recipient_username: z.string().nullable().optional(),
});

// GET /bounties
bountiesRouter.get("/", (_req, res) => {
  const bounties = store.listBounties();
  res.json({ data: bounties });
});

// GET /bounties/:id
bountiesRouter.get("/:id", (req, res) => {
  const bounty = store.getBounty(req.params.id);
  if (!bounty) {
    return res.status(404).json({ error: "Bounty not found" });
  }
  res.json({ data: bounty });
});

// POST /bounties
bountiesRouter.post("/", (req, res) => {
  const result = CreateBountySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: result.error.message,
    });
  }

  const bounty = store.createBounty({
    title: result.data.title,
    description: result.data.description,
    amount_usd: result.data.amount_usd,
    currency: result.data.currency,
    recipient_username: result.data.recipient_username ?? null,
  });

  res.status(201).json({ data: bounty });
});
