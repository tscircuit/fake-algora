import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: z.object({
    recipient: z.string(),
    amount: z.number().positive(),
    currency: z.string().optional().default("USD"),
    bounty_id: z.string().optional(),
    issue_number: z.number().optional(),
    repository: z.string().optional(),
  }),
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = await req.json()
  const payment = ctx.db.createPayment(body)
  return ctx.json({ payment })
})
