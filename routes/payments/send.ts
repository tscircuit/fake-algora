import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const paymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  repository: z.string().optional(),
  issue_number: z.number().int().positive().optional(),
  bounty_id: z.string().optional(),
  idempotency_key: z.string().optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: paymentRequestSchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const paymentRequest = await req.json()
  const payment = ctx.db.addPayment(paymentRequest)

  return ctx.json({ payment })
})
