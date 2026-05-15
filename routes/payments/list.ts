import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentSchema } from "lib/db/schema.ts"

/**
 * GET /payments/list
 *
 * Lists payments. Filter by `status`, `recipient`, or `repository`. With no
 * filters set, returns all payments in creation order.
 */
export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    status: z
      .enum(["pending", "completed", "canceled", "failed"])
      .optional(),
    recipient: z.string().optional(),
    repository: z.string().optional(),
  }),
  jsonResponse: z.object({
    payments: z.array(paymentSchema),
  }),
})((req, ctx) => {
  const { status, recipient, repository } = req.query
  let payments = ctx.db.payments
  if (status) payments = payments.filter((p) => p.status === status)
  if (recipient) payments = payments.filter((p) => p.recipient === recipient)
  if (repository) payments = payments.filter((p) => p.repository === repository)
  return ctx.json({ payments })
})
