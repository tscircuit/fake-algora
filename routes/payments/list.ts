import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["GET"],
  jsonResponse: z.object({
    payments: z.array(
      z.object({
        payment_id: z.string(),
        amount: z.number(),
        currency: z.string(),
        recipient: z.string(),
        description: z.string(),
        status: z.string(),
        created_at: z.string(),
      }),
    ),
  }),
})((req, ctx) => {
  return ctx.json({ payments: ctx.db.payments })
})
