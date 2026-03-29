import { Router } from "express";
import { z } from "zod";
import { store } from "../store";

export const paymentsRouter = Router();

const SendPaymentSchema = z.object({
  bounty_id: z.string().min(1),
});

// GET /payments
paymentsRouter.get("/", (_req, res) => {
  const payments = store.listPayments();
  res.json({ data: payments });
});

// GET /payments/:id
paymentsRouter.get("/:id", (req, res) => {
  const payment = store.getPayment(req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Payment not found" });
  }
  res.json({ data: payment });
});

// POST /payments/send
paymentsRouter.post("/send", (req, res) => {
  const result = SendPaymentSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: result.error.message });
  }

  const { bounty_id } = result.data;

  // Verify bounty exists
  const bounty = store.getBounty(bounty_id);
  if (!bounty) {
    return res.status(404).json({ error: "Bounty not found" });
  }

  // Prevent paying a bounty that has no assigned recipient
  if (!bounty.recipient_username) {
    return res
      .status(400)
      .json({ error: "Bounty has no recipient assigned; cannot send payment" });
  }

  // Guard against double payment
  if (bounty.status === "paid") {
    return res
      .status(409)
      .json({ error: "Bounty has already been paid", bounty_id });
  }

  if (bounty.status === "cancelled") {
    return res.status(400).json({ error: "Cannot pay a cancelled bounty" });
  }

  // Derive payment fields from the bounty to avoid inconsistent records
  const payment = store.createPayment({
    bounty_id,
    amount_usd: bounty.amount_usd,
    currency: bounty.currency,
    recipient_username: bounty.recipient_username,
  });

  // Mark bounty as paid
  store.updateBountyStatus(bounty_id, "paid");

  res.status(201).json({ data: payment });
});
