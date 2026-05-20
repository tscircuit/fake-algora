import { paymentSchema } from "lib/db/schema"
import { withRouteSpec } from "lib/middleware/with-winter-spec"
import { z } from "zod"

const sendPaymentRequestSchema = z.object({
  recipient: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1).default("USD"),
  bounty_issue: z.number().int().positive().optional(),
  repository: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
})

export default withRouteSpec({
  methods: ["POST"],
  jsonBody: sendPaymentRequestSchema,
  jsonResponse: z.object({
    payment: paymentSchema,
  }),
})(async (req, ctx) => {
  const body = sendPaymentRequestSchema.parse(await req.json())
  const payment = ctx.db.sendPayment(body)

  return ctx.json({ payment })
})
