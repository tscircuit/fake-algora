import { Router, type Request, type Response, type NextFunction } from "express"
import { z } from "zod"
import { store } from "../store"
import { createError } from "../middleware/errorHandler"
import type { ApiResponse } from "../types"

export const paymentsRouter = Router()

// ─── Validation schemas ───────────────────────────────────────────────────────

const SendPaymentSchema = z.object({
  bounty_id: z.string().min(1, "bounty_id is required"),
  recipient_username: z.string().min(1, "recipient_username is required"),
  recipient_email: z.string().email().optional(),
  amount_cents: z
    .number()
    .int("amount_cents must be an integer")
    .positive("amount_cents must be positive"),
  currency: z.string().default("USD"),
  metadata: z.record(z.unknown()).optional(),
})

// ─── POST /payments — Send a payment ─────────────────────────────────────────

/**
 * Send a payment for a bounty.
 *
 * Body:
 *   bounty_id          string   — ID of the bounty being paid
 *   recipient_username string   — Algora username of the recipient
 *   recipient_email    string?  — Optional email for the recipient
 *   amount_cents       number   — Amount in cents (e.g. 1000 = $10.00)
 *   currency           string?  — ISO currency code, default "USD"
 *   metadata           object?  — Arbitrary key/value metadata
 */
paymentsRouter.post(
  "/",
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = SendPaymentSchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        createError(
          parsed.error.errors.map((e) => e.message).join("; "),
          422,
          "VALIDATION_ERROR"
        )
      )
    }

    const bounty = store.getBounty(parsed.data.bounty_id)
    if (!bounty) {
      return next(
        createError(
          `Bounty '${parsed.data.bounty_id}' not found`,
          404,
          "BOUNTY_NOT_FOUND"
        )
      )
    }

    if (bounty.status === "paid") {
      return next(
        createError(
          `Bounty '${parsed.data.bounty_id}' has already been paid`,
          409,
          "BOUNTY_ALREADY_PAID"
        )
      )
    }

    const payment = store.createPayment(parsed.data)
    const body: ApiResponse<typeof payment> = { data: payment }
    res.status(201).json(body)
  }
)

// ─── GET /payments — List all payments (optionally filtered by bounty) ────────

paymentsRouter.get(
  "/",
  (_req: Request, res: Response): void => {
    const bountyId = _req.query.bounty_id as string | undefined
    const payments = store.listPayments(bountyId)
    const body: ApiResponse<typeof payments> = { data: payments }
    res.json(body)
  }
)

// ─── GET /payments/:id — Get a single payment ─────────────────────────────────

paymentsRouter.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction): void => {
    const payment = store.getPayment(req.params.id)
    if (!payment) {
      return next(
        createError(`Payment '${req.params.id}' not found`, 404, "NOT_FOUND")
      )
    }
    const body: ApiResponse<typeof payment> = { data: payment }
    res.json(body)
  }
)
