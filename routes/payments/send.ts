import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentSchema } from "lib/db/schema.ts"

/**
 * POST /payments/send
 *
 * Creates a pending payment. Provide an `idempotency_key` to make the call
 * retry-safe — repeated sends with the same key return the same payment
 * record rather than creating duplicates.
 */
export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string().min(1),
    amount: z.number().positive(),
    currency: z.string().default("USD"),
    bounty_id: z.string().optional(),
    issue_number: z.number().optional(),
    repository: z.string().optional(),
    idempotency_key: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const payment = ctx.db.addPayment({
    recipient: body.recipient,
    amount: body.amount,
    currency: body.currency,
    bounty_id: body.bounty_id ?? null,
    issue_number: body.issue_number ?? null,
    repository: body.repository ?? null,
    idempotency_key: body.idempotency_key ?? null,
  })
  return ctx.json({ payment })
})
