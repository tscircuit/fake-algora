import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { store } from "../store";

const router = Router();

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const SendPaymentSchema = z.object({
  bounty_id: z.string().min(1, "bounty_id is required"),
  recipient_username: z.string().min(1, "recipient_username is required"),
  amount_usd: z.number().positive("amount_usd must be positive"),
  currency: z.string().default("USD"),
});

// ---------------------------------------------------------------------------
// GET /payments — list all payments
// ---------------------------------------------------------------------------
router.get("/", (_req, res) => {
  res.json({ payments: store.listPayments() });
});

// ---------------------------------------------------------------------------
// GET /payments/:id — get a single payment
// ---------------------------------------------------------------------------
router.get("/:id", (req, res) => {
  const payment = store.getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }
  res.json({ payment });
});

// ---------------------------------------------------------------------------
// POST /payments/send — send a payment for a bounty
// ---------------------------------------------------------------------------
router.post("/send", (req, res) => {
  const result = SendPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: result.error.format() });
  }

  const { bounty_id, recipient_username, amount_usd, currency } = result.data;

  // Validate the bounty exists
  const bounty = store.getBounty(bounty_id);
  if (!bounty) {
    return res
      .status(404)
      .json({ error: "Bounty not found", details: `No bounty with id "${bounty_id}"` });
  }

  // Guard: don't allow double-payment
  if (bounty.status === "paid") {
    return res.status(409).json({
      error: "Bounty already paid",
      details: `Bounty "${bounty_id}" has already been marked as paid`,
    });
  }

  // Create payment record (simulate async processing → immediately complete)
  const payment = store.createPayment({
    bounty_id,
    recipient_username,
    amount_usd,
    currency,
    status: "completed",
    transaction_id: `txn_${uuidv4().replace(/-/g, "").slice(0, 16)}`,
  });

  // Update bounty status
  store.updateBounty(bounty_id, {
    status: "paid",
    recipient_username,
  });

  res.status(201).json({
    payment,
    message: `Payment of $${amount_usd} ${currency} sent to @${recipient_username} for bounty ${bounty_id}`,
  });
});

export default router;
