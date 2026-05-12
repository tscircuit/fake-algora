import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(
      z.object({
        payment_id: z.string(),
        recipient: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.enum(["pending", "completed", "canceled", "failed"]),
        idempotency_key: z.string().optional(),
        bounty_issue: z.string().optional(),
        metadata: z.record(z.string(), z.string()),
        created_at: z.string(),
        updated_at: z.string(),
      }),
    ),
  }),
})(async (_req, ctx) => {
  return ctx.json({
    payments: ctx.db.getState().payments,
  })
})
