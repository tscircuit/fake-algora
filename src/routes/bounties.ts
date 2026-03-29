import { Router } from "express";
import { z } from "zod";
import { store } from "../store";

const router = Router();

// GET /bounties — list all bounties
router.get("/", (_req, res) => {
  res.json({ bounties: store.listBounties() });
});

// GET /bounties/:id — get a single bounty
router.get("/:id", (req, res) => {
  const bounty = store.getBounty(req.params.id);
  if (!bounty) {
    return res.status(404).json({ error: "Bounty not found" });
  }
  res.json({ bounty });
});

// POST /bounties — create a new bounty
const CreateBountySchema = z.object({
  issue_number: z.number().int().positive(),
  repo: z.string().min(1),
  amount_usd: z.number().positive(),
  currency: z.string().default("USD"),
  recipient_username: z.string().nullable().default(null),
  status: z
    .enum(["open", "in_progress", "completed", "payment_pending", "paid"])
    .default("open"),
});

router.post("/", (req, res) => {
  const result = CreateBountySchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: result.error.format() });
  }
  const bounty = store.createBounty(result.data);
  res.status(201).json({ bounty });
});

export default router;
