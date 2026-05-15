import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentSchema } from "lib/db/schema.ts"

/**
 * GET /payments/get
 *
 * Fetch a single payment by its `payment_id`. Returns `{ payment: null }` if
 * not found rather than a 404 — keeps the response schema simple and lets
 * clients branch on the body instead of HTTP status.
 */
export default withRouteSpec({
  methods: ["GET"],
  queryParams: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})((req, ctx) => {
  const payment = ctx.db.getPayment(req.query.payment_id)
  return ctx.json({ payment })
})
