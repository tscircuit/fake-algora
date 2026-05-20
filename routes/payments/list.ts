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
        bounty_issue: z.number().optional(),
        status: z.enum(["pending", "sent"]),
      }),
    ),
  }),
})((req, ctx) => {
  return ctx.json({ payments: ctx.db.payments })
})
