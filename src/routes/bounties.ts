import { Router } from "express";
import { z } from "zod";
import { store } from "../store";

export const bountiesRouter = Router();

const CreateBountySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  amount_usd: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  recipient_username: z.string().optional(),
});

/** GET /bounties — list all bounties */
bountiesRouter.get("/", (_req, res) => {
  res.json({ data: store.listBounties() });
});

/** GET /bounties/:id — get a single bounty */
bountiesRouter.get("/:id", (req, res) => {
  const bounty = store.getBounty(req.params.id);
  if (!bounty) {
    return res.status(404).json({ error: "Bounty not found" });
  }
  return res.json({ data: bounty });
});

/** POST /bounties — create a new bounty */
bountiesRouter.post("/", (req, res) => {
  const result = CreateBountySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: result.error.format(),
    });
  }
  const bounty = store.createBounty(result.data);
  return res.status(201).json({ data: bounty });
});
