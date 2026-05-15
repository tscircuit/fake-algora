import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"
import { paymentSchema } from "lib/db/schema.ts"

/**
 * POST /payments/complete
 *
 * Mark a pending payment as `completed`. No-op if the payment is already in a
 * terminal state — the existing record is returned unchanged. Returns
 * `{ payment: null }` if the id doesn't exist.
 */
export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    payment_id: z.string().min(1),
  }),
  jsonResponse: z.object({
    payment: paymentSchema.nullable(),
  }),
})(async (req, ctx) => {
  const { payment_id } = await req.json()
  const updated = ctx.db.updatePaymentStatus(payment_id, "completed")
  return ctx.json({ payment: updated })
})
