import { Router } from "express";
import { z } from "zod";
import { store } from "../store";

export const paymentsRouter = Router();

/** GET /payments — list all payments */
paymentsRouter.get("/", (_req, res) => {
  res.json({ data: store.listPayments() });
});

/** GET /payments/:id — get a single payment */
paymentsRouter.get("/:id", (req, res) => {
  const payment = store.getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }
  return res.json({ data: payment });
});

const SendPaymentSchema = z.object({
  bounty_id: z.string().min(1),
});

/**
 * POST /payments/send
 *
 * Sends a payment for the given bounty. All payment fields
 * (amount_usd, currency, recipient_username) are derived from the
 * bounty record to prevent inconsistent data.
 *
 * Rules:
 *  - The bounty must exist.
 *  - The bounty must have a recipient_username assigned.
 *  - The bounty must not already be paid (idempotency guard).
 *  - On success the bounty status is updated to "paid".
 */
paymentsRouter.post("/send", (req, res) => {
  const result = SendPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: result.error.format(),
    });
  }

  const { bounty_id } = result.data;

  const bounty = store.getBounty(bounty_id);
  if (!bounty) {
    return res.status(404).json({ error: "Bounty not found" });
  }

  if (!bounty.recipient_username) {
    return res
      .status(422)
      .json({ error: "Bounty has no recipient assigned; cannot send payment" });
  }

  if (bounty.status === "paid") {
    return res
      .status(409)
      .json({ error: "Payment already sent for this bounty" });
  }

  // Derive all monetary / recipient fields directly from the bounty
  const payment = store.createPayment({
    bounty_id,
    amount_usd: bounty.amount_usd,
    currency: bounty.currency,
    recipient_username: bounty.recipient_username,
  });

  // Mark the bounty as paid
  store.updateBountyStatus(bounty_id, "paid");

  return res.status(201).json({ data: payment });
});
