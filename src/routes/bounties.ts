import { Router, type Request, type Response, type NextFunction } from "express"
import { z } from "zod"
import { store } from "../store"
import { createError } from "../middleware/errorHandler"
import type { ApiResponse } from "../types"

export const bountiesRouter = Router()

// ─── Validation schemas ───────────────────────────────────────────────────────

const CreateBountySchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  amount_cents: z
    .number()
    .int("amount_cents must be an integer")
    .nonnegative("amount_cents must be >= 0"),
  currency: z.string().default("USD"),
  issue_url: z.string().url().optional(),
})

// ─── GET /bounties — List all bounties ───────────────────────────────────────

bountiesRouter.get("/", (_req: Request, res: Response): void => {
  const bounties = store.listBounties()
  const body: ApiResponse<typeof bounties> = { data: bounties }
  res.json(body)
})

// ─── GET /bounties/:id — Get a single bounty ─────────────────────────────────

bountiesRouter.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction): void => {
    const bounty = store.getBounty(req.params.id)
    if (!bounty) {
      return next(
        createError(`Bounty '${req.params.id}' not found`, 404, "NOT_FOUND")
      )
    }
    const body: ApiResponse<typeof bounty> = { data: bounty }
    res.json(body)
  }
)

// ─── POST /bounties — Create a bounty ────────────────────────────────────────

bountiesRouter.post(
  "/",
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = CreateBountySchema.safeParse(req.body)
    if (!parsed.success) {
      return next(
        createError(
          parsed.error.errors.map((e) => e.message).join("; "),
          422,
          "VALIDATION_ERROR"
        )
      )
    }
    const bounty = store.createBounty(parsed.data)
    const body: ApiResponse<typeof bounty> = { data: bounty }
    res.status(201).json(body)
  }
)
